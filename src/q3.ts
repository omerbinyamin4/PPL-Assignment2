import { ClassExp, ProcExp, Exp, Program, Binding, AppExp, CExp, makeAppExp, makeBoolExp, makeIfExp, makePrimOp, makeProcExp, makeStrExp, makeVarDecl, makeVarRef, PrimOp, VarDecl} from "./L31-ast";
import { Result, makeFailure } from "../shared/result";

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
    if (index > methods.length){
        return makeBoolExp(false);
    }
    else{
        const test: AppExp = makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeStrExp(methods[index].var.var)]);
        return makeIfExp(test, methods[index].val, method2if(methods, index + 1));
    }
}
    //@TODO

/*
Purpose: Transform L31 AST to L3 AST
Signature: l31ToL3(l31AST)
Type: [Exp | Program] => Result<Exp | Program>
*/
// export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
//     makeFailure("TODO");
