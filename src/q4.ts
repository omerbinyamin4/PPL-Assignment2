import { AppExp, Exp, IfExp, isAppExp, isBoolExp, isCompoundExp, isDefineExp, isIfExp, isLetExp, isLitExp, isNumExp, isPrimOp, isProcExp, isProgram, isStrExp, isVarRef, PrimOp, ProcExp, VarDecl } from '../imp/L3-ast';
import { Closure, isClosure, isCompoundSExp, isEmptySExp, isSymbolSExp } from '../imp/L3-value';
import { Result, makeFailure } from '../shared/result';
import { isNumber, isString } from "../shared/type-predicates";
import { map, slice } from "ramda";

type Value = number | boolean | string | PrimOp /*| Closure*/;
type CompoundExp = AppExp | IfExp | ProcExp;


/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
    isBoolExp(exp) ? valueToString(exp.val) :
    isNumExp(exp) ? valueToString(exp.val) :
    isStrExp(exp) ? valueToString(exp.val) :
    isVarRef(exp) ? exp.var :
    isProcExp(exp) ? unparseProcExp(exp) :
    isIfExp(exp) ? `(${l2ToPython(exp.then)} if ${l2ToPython(exp.test)} else ${l2ToPython(exp.alt)})` :
    isAppExp(exp) ? unparseAppExp(exp, isInTheMiddle(exp)) :
    isPrimOp(exp) ? valueToString(exp.op) :
    isDefineExp(exp) ? `(define ${exp.var.var} ${l2ToPython(exp.val)})` : // @TODO
    isProgram(exp) ? unparseLExps(exp.exps) :
    exp;

const valueToString = (val: Value): string =>
    isNumber(val) ?  val.toString() :
    val === true ? 'True' :
    val === false ? 'False' :
    isString(val) ? `"${val}"` :
    // isClosure(val) ? closureToString(val) :
    // isCompoundExp(val) ? co
    isPrimOp(val) ? val.op : // @TODO make prec
    val;

// const closureToString = (val : Closure) : string =>

const unparseProcExp = (pe : ProcExp) : string =>
    `(lambda ${slice(0, -2, map((p: VarDecl) => p.var, pe.args).join(", "))} : ${unparseLExps(pe.body)})` // @TODO one paramater ()

const unparseLExps = (les: Exp[]): string =>
    map(l2ToPython, les).join(""); // @TODO maybe change

const unparseAppExp = (ap : AppExp, isInTheMiddle: boolean) : string => {
    const y : string = `${l2ToPython(ap.rator)}`;
    if (isInTheMiddle) return `${map((x : Exp) : string => `${l2ToPython(x)} ${y}`, ap.rands)}` // @TODO delete last op
    else 
    // `(${l2ToPython(exp.rator)} ${unparseLExps(exp.rands)})`


    
}

const isInTheMiddle = (ap: AppExp) : boolean =>
    isPrimOp(ap.rator) ? !(((ap.rator.op) === '?boolean') || ((ap.rator.op) === '?number')) : true // can be other than than primOP?
