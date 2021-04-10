import { ClassExp, ProcExp, Exp, Program} from "./L31-ast";
import { Result, makeFailure } from "../shared/result";
import { AppExp, Binding, CExp, makeAppExp, makeBoolExp, makeIfExp, makePrimOp, makeProcExp, makeStrExp, makeVarDecl, makeVarRef, PrimOp, VarDecl } from "../imp/L3-ast";

/*
Purpose: Transform ClassExp to ProcExp
Signature: for2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>{
    const vars: VarDecl[] = exp.fields;
    const methods: Binding[] = exp.methods;
    const body: CExp[] = [makeProcExp([makeVarDecl("3")], [method2if(methods, 0)])];

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
