import { ClassExp, ProcExp, Exp, Program, Binding, AppExp, CExp, makeAppExp, makeBoolExp, makeIfExp, makePrimOp, makeProcExp, makeVarDecl, makeVarRef, VarDecl, isExp, isProgram, makeProgram, isCExp, isDefineExp, makeDefineExp, isAtomicExp, isLitExp, isIfExp, isAppExp, isProcExp, isLetExp, isClassExp, makeLetExp, makeBinding, makeLitExp} from "./L31-ast";
import { Result, makeFailure, makeOk } from "../shared/result";
import { makeSymbolSExp } from "../imp/L3-value";
import { map } from "ramda";


/*
Purpose: Transform ClassExp to ProcExp
Signature: for2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>{
    const vars: VarDecl[] = exp.fields;
    const body: CExp[] = [makeProcExp([makeVarDecl("msg")], [method2if(exp.methods, 0)])];
    return makeProcExp(vars, body);
}

const method2if = (methods: Binding[], index: number) : CExp => {
    return index === methods.length ? makeBoolExp(false) :
        makeIfExp(
            makeAppExp(
                makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(methods[index].var.var))]),
                 makeAppExp(methods[index].val, []),
                  method2if(methods, index + 1));
}

/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
    isExp(exp) ? makeOk(rewriteAllClassExp(exp)) :
    isProgram(exp) ? makeOk(makeProgram(map(rewriteAllClassExp, exp.exps))) :
    makeFailure("error"); // @TODO: what to write?

const rewriteAllClassExp = (exp: Exp) : Exp =>
    isCExp(exp) ? rewriteallClassCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteallClassCExp(exp.val)) :
    exp;

const rewriteallClassCExp = (exp: CExp) : CExp =>
    isAtomicExp(exp) ? exp :
    isLitExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(
        rewriteallClassCExp(exp.test),
        rewriteallClassCExp(exp.then),
        rewriteallClassCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteallClassCExp(exp.rator),
        map(rewriteallClassCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteallClassCExp, exp.body)) :
    isLetExp(exp) ? makeLetExp(
        map((binding : Binding)  => makeBinding(binding.var.var, rewriteallClassCExp(binding.val)), exp.bindings),
        map(rewriteallClassCExp, exp.body)) :
    isClassExp(exp) ? rewriteallClassCExp(class2proc(exp)) :
    exp;
