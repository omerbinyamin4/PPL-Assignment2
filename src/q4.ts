import { AppExp, DefineExp, Exp, IfExp, isAppExp, isBoolExp, isDefineExp, isIfExp, isNumExp, isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, PrimOp, ProcExp, Program, VarDecl } from '../imp/L3-ast';
import { Result, makeFailure, makeOk, bind, isOk, mapResult } from '../shared/result';
import { isNumber, isString } from "../shared/type-predicates";
import { map } from "ramda";

type Value = number | boolean | string | PrimOp /*| Closure*/;

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
    isBoolExp(exp) ? valueToString(exp.val) :
    isNumExp(exp) ? valueToString(exp.val) :
    isStrExp(exp) ? valueToString(exp.val) :
    isVarRef(exp) ? makeOk(exp.var) :
    isProcExp(exp) ? unparseProcExp(exp) :
    isIfExp(exp) ? unparseIfExp(exp) :
    isAppExp(exp) ? unparseAppExp(exp, isInTheMiddle(exp)) :
    isPrimOp(exp) ? valueToString(exp) :
    isDefineExp(exp) ? unparseDefineExp(exp) :
    isProgram(exp) ? unparseLExps(exp.exps) :
    makeFailure("error");

const valueToString = (val: Value): Result<string> =>
    isNumber(val) ?  makeOk(val.toString()) :
    val === true ? makeOk('True') :
    val === false ? makeOk('False') :
    isPrimOp(val) ? primOpToString(val.op) :
    isString(val) ? makeOk(`"${val}"`) :
    // isClosure(val) ? closureToString(val) :
    makeFailure("never");

// const closureToString = (val : Closure) : string =>

const unparseProcExp = (pe : ProcExp) : Result<string> =>{
    const result = unparseLExps(pe.body);
    return isOk(result) ? makeOk(`(lambda ${map((p: VarDecl) => p.var, pe.args).join(",")} : ${result.value})`) :
        makeFailure("failed to unparse proc body");
    }

const unparseLExps = (les: Exp[]): Result<string> =>
    les.length == 1 ? bind(mapResult(l2ToPython, les), (x: string[]) => makeOk(x.join(""))) : 
        bind(mapResult(l2ToPython, les), (x: string[]) => makeOk(x.join("\n")));

const unparseAppExp = (ap : AppExp, isInTheMiddle: boolean) : Result<string> => {
    const opResult : Result<string> = l2ToPython(ap.rator);
    const randsResult : Result<string[]> = mapResult((x : Exp) : Result<string> => l2ToPython(x), ap.rands);
    if (isOk(opResult) && isOk(randsResult)) {
        if (isInTheMiddle) return makeOk(`(${randsResult.value.join(` ${opResult.value} `)})`)
        else if (opResult.value === 'not') return makeOk(`(${opResult.value} ${randsResult.value.join("")})`)
        else return makeOk(`${opResult.value}(${randsResult.value.join(",")})`)
    }
    return makeFailure("failed to unparse AppExp");  
}

const isInTheMiddle = (ap: AppExp) : boolean =>
    isPrimOp(ap.rator) ? !(((ap.rator.op) === '?boolean') || ((ap.rator.op) === '?number') || ((ap.rator.op) === 'not')) : 
    false

const primOpToString = (op : string) : Result<string> =>
    op === 'boolean?' ? makeOk(`(lambda x : (type(x) == bool))`) :
    op === 'number?' ? makeOk(`(lambda x : ((type(x) == int) or (type(x) == float))`) :
    op === 'eq?' || op === '=' ? makeOk(`==`) :
    makeOk(op);

const unparseIfExp = (ie : IfExp) : Result<string> => {
    const testResult : Result<string> = l2ToPython(ie.test);
    const thenResult : Result<string> = l2ToPython(ie.then);
    const elseResult : Result<string> = l2ToPython(ie.alt);
    if (isOk(testResult) && isOk(thenResult) && isOk(elseResult))
        return makeOk(`(${thenResult.value} if ${testResult.value} else ${elseResult.value})`)
    else return makeFailure("failed unparse ifExp")
}

const unparseDefineExp = (de : DefineExp) : Result<string> => {
    const valueResult : Result<string> = l2ToPython(de.val);
    return isOk(valueResult) ? makeOk(`${de.var.var} = ${valueResult.value}`) : makeFailure("failed to parse defEXP")
}