import { ClassExp, ProcExp, Exp, Program, Binding, AppExp, CExp, makeAppExp, makeBoolExp, makeIfExp, makePrimOp, makeProcExp, makeVarDecl, makeVarRef, VarDecl, isExp, isProgram, makeProgram, isCExp, isDefineExp, makeDefineExp, isAtomicExp, isLitExp, isIfExp, isAppExp, isProcExp, isLetExp, isClassExp, makeLetExp, makeBinding, makeLitExp, IfExp, LetExp, DefineExp} from "./L31-ast";
import { Result, makeFailure, makeOk, isOk, mapResult, isFailure, bind } from "../shared/result";
import { makeSymbolSExp } from "../imp/L3-value";
import { map, zipWith } from "ramda";


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
    isExp(exp) ? rewriteAllClassExp(exp) :
    isProgram(exp) ? rewriteAllClassProgram(exp) :
    makeFailure("error1"); // @TODO: what to write?
    // makeProgram(map(rewriteAllClassExp, exp.exps)) : mapResult(rewriteAllClassExp, exp.exps)

const rewriteAllClassProgram = (exp: Program) : Result<Program> => {
    const x : Result<Exp[]> = mapResult(rewriteAllClassExp, exp.exps);
    return isOk(x) ? makeOk(makeProgram(x.value)) : makeFailure("Failed to rewrite Program")
}

const rewriteAllClassExp = (exp: Exp) : Result<Exp> =>
    isCExp(exp) ? rewriteallClassCExp(exp) :
    isDefineExp(exp) ? rewriteAllClassDefineExp(exp) :
    makeFailure("error2");

const rewriteAllClassDefineExp = (exp: DefineExp) : Result<Exp> => {
    const val : Result<CExp> = rewriteallClassCExp(exp.val);
    return isOk(val) ? makeOk(makeDefineExp(exp.var, val.value)) : makeFailure("Failed to rewrite DefineExp")
}

const rewriteallClassCExp = (exp: CExp) : Result<CExp> =>
    isAtomicExp(exp) ? makeOk(exp) :
    isLitExp(exp) ? makeOk(exp) :
    isIfExp(exp) ? rewriteClassIfExp(exp) :
    isAppExp(exp) ? rewriteClassAppExp(exp) :
    isProcExp(exp) ? rewriteClassProcExp(exp) :
    isLetExp(exp) ?  rewriteClassLetExp(exp) :
    isClassExp(exp) ? rewriteallClassCExp(class2proc(exp)) :
    exp;

const rewriteClassIfExp = (exp: IfExp) : Result<CExp> => {
    const testResult: Result<CExp> = rewriteallClassCExp(exp.test);
    const thenResult: Result<CExp> = rewriteallClassCExp(exp.then);
    const elseResult: Result<CExp> = rewriteallClassCExp(exp.alt);
    return isOk(testResult) && isOk(thenResult) && isOk(elseResult) ? 
        makeOk(makeIfExp(testResult.value, thenResult.value, elseResult.value)) :
            makeFailure('Failed to rewrite ifExp')
}

const rewriteClassAppExp = (exp: AppExp) : Result<CExp> => {
    const opResult: Result<CExp> = rewriteallClassCExp(exp.rator)
    const ratorsResult: Result<CExp[]> = mapResult(rewriteallClassCExp, exp.rands);
    return isOk(opResult) && isOk(ratorsResult) ? makeOk(makeAppExp(opResult.value, ratorsResult.value)) :
                            makeFailure("Failed to rewrite AppExp")
}

const rewriteClassProcExp = (exp: ProcExp) : Result<CExp> => {
    const bodyResult: Result<CExp[]> = mapResult(rewriteallClassCExp, exp.body);
    return isOk(bodyResult) ? makeOk(makeProcExp(exp.args, bodyResult.value)) :
                                makeFailure("Failed to rewrite ProcExp")
}

const rewriteClassLetExp = (exp: LetExp) : Result<CExp> => {
    const valuesResult : Result<CExp[]> = mapResult((binding: Binding) => rewriteallClassCExp(binding.val), exp.bindings);
    const varNames : string[] = map((binding: Binding) => binding.var.var ,exp.bindings);
    const methodsBindings : Result<Binding[]> = bind(valuesResult, (body: CExp[]) => makeOk(zipWith(makeBinding, varNames, body)));
    const bodyResult : Result<CExp[]> = mapResult(rewriteallClassCExp, exp.body);
    return isFailure(methodsBindings) ? makeFailure("Failed to rewrite LetExp - Failure in vals of bindings") :
            isFailure(bodyResult) ? makeFailure("Failed to rewrite LetExp - Failure in body") :
            makeOk(makeLetExp(methodsBindings.value, bodyResult.value))
}
