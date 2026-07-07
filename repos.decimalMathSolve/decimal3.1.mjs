class decimalsup{
    static sum(init,...args){
        return args.reduce((prev,curr)=>prev+curr,init)
    }
    static sum_sub(init,...args){
        return args.reduce((prev,curr)=>prev-curr,init)
    }
    /**@param {string|number} s @param {number} d10$x @returns {string}*/
    static shiftRight(s,d10$x=0){
        if (d10$x==0)return s
        if (d10$x<0)return this.shiftLeft(s,-d10$x)
        let str=String(s).replace(/\+/,"")
        const sign=str.startsWith("-")?"-":"";
        if (str.startsWith("-")){
            str=str.slice(1)
        }
        let [int="0",float=""]=str.split(".")
        let all=int+float
        let ndotps=int.length+d10$x
        let res
        if (ndotps>=all.length){
            res=all.padEnd(ndotps,"0")
        }else{
            res=all.slice(0,ndotps)+"."+all.slice(ndotps)
        }
        return sign+res.replace(/^(0+)(.+$)/g,"$2").replace(/^\./,"0.").replace(/\.0+$/, "").replace(/(\.\d*?[1-9])0+$/, "$1")
    }
    /**@param {string|number} s @param {number} d10$x @returns {string} */
    static shiftLeft(s,d10$x){
        if (d10$x==0)return s
        if (d10$x<0)return this.shiftRight(s,-d10$x)
        let str=String(s).replace(/\+/,"")
        const sign=str.startsWith("-")?"-":"";
        if (str.startsWith("-")){
            str=str.slice(1)
        }
        let [int="0",float=""]=str.split(".")
        let all=int+float
        let ndotps=int.length-d10$x
        let res
        let result
        let ndotps2
        if (ndotps<=0){
            res=all.padStart(all/*int*/.length+d10$x,"0")
            //ndotps2=res.length-d10$x
            ndotps2=res.length-float.length-d10$x
        }else{
            ndotps2=ndotps
            res=all
        }
        result=res.slice(0,ndotps2)+"."+res.slice(ndotps2)
        return sign+result.replace(/^(0+)(.+$)/g,"$2").replace(/^\./,"0.").replace(/\.0+$/, "").replace(/(\.\d*?[1-9])0+$/, "$1")
    }
    /**@param {Array<any>} args @returns {Array<decimalPack>} */
    static toalldp(...a){
        const start=a[0].startsWith("config:")?1:0
        /**@type {Array<string>} */
        const config=start?JSON.parse(a[0].slice(7)):[]
        if (start){
            a=a.slice(1)
        }
        for (let i=0;i<a.length;i++){
            if (((!(a[i] instanceof decimalPack))||(!(a[i].constructor===decimalPack)))){
                if (Array.isArray(a[i])){
                    a[i]=new decimalPack(...a[i],...config)
                }else{
                    a[i]=new decimalPack(a[i],...config)
                }
            }
        }
        //console.log(a)
        return a
    }
    static decimalPackClassSystem_concatValueSystem(val,limit=val.length){
        const [int="0",float=""]=val.split(".")
        const lps=Math.min(float.length,limit)
        return [int,float.slice(0,lps)].join(".").replace(/\.$/,"")
    }
    [Symbol.toStringTag]="decimalsup"
}
class decimalPack{
    #dataConfig={setupShift:0,setupLimit:Infinity,d10$x_d:"0",d10$x_exp:0}
    constructor(value,limit=Infinity,constshift=null,expmode=false){
        if (expmode||(!!value.includes&&value.includes("e"))){
            this.#expSetup(value,limit,constshift)
        }else{
            this.#setup(value,limit,constshift)
        }
    }
    #setup(value,limit,constShift=null){
        const lim=limit??Infinity
        const v=decimalsup.decimalPackClassSystem_concatValueSystem(String(value),lim)
        if (constShift!==null&&!!constShift.startsWith&&constShift.startsWith("total::")){
            this.exp=Number(constShift.slice(7))/*+(v.includes(".")?v.length-v.indexOf(".")-1:0)*/
        }else{
            this.exp=(Number.isNaN(Number(constShift))||!constShift)?(v.includes(".")?v.length-v.indexOf(".")-1:0):Number(constShift)
        }
        const vint_temp=decimalsup.shiftRight(v,this.exp)
        this.vint=BigInt(vint_temp)
        this.raw=v
        this.sign=this.vint<0n?-1:1
        this.#dataConfig.setupShift=constShift
        this.#dataConfig.setupLimit=lim
        this.#dataConfig.d10$x_exp=-(this.exp-(this.vint.toString().replace("-","").length-1))
        this.#dataConfig.d10$x_d=decimalsup.shiftLeft(String(this.raw),this.#dataConfig.d10$x_exp)
    }
    /**@param {string} value */
    #expSetup(value,limit,constShift=null){
        const v=value.split("e")
        this.#setup(decimalsup.shiftRight(v[0],Number(v[1])),limit,constShift)
    }
    get d10$x_exp(){
        return this.#dataConfig.d10$x_exp
    }
    get d10$x_d(){
        return this.#dataConfig.d10$x_d
    }
    /*
    returnQuantize:{
        canUse:{
            "ROUND_HALF_UP":0,
            "ROUND_HALF_EVEN":1,
            "ROUND_HALF_DOWN":2,
            "ROUND_UP":3,
            "ROUND_DOWN":4,
            "ROUND_CEILING":5,
            "ROUND_FLOOR":6,
            "ROUND_05UP":7
        },
        default:0,
        usingFunc:0,
    }
    */
    static quantize(value,limit,round){
        const quantizeWords=["Infinity","-Infinity","NaN","null","undefined"]
        if (quantizeWords.includes(String(value)))return value
        const shifted=String(decimalsup.shiftRight(value,limit))
        //_int:shiftedInt,_float:shiftedFloat
        const [_int_temp="0",_float=""]=shifted.split(".")
        const _int=_int_temp.includes("-")?_int_temp.slice(1):_int_temp
        const sign=_int_temp.includes("-")?"-":""
        let _addVal=0n
        if (round===0){
            if (_float.length===0){
                _addVal=0n
            }else{
                /*if (sign==="-"){
                    if (Number(_float[0])>5||(Number(_float[0])===5&&!(/^50+$/.test(_float)))){
                        _addVal=1n
                    }else{
                        _addVal=0n
                    }
                }else{
                    if (Number(_float[0])>=5){
                        _addVal=1n
                    }else{
                        _addVal=0n
                    }
                }*/
                if (Number(_float[0])>=5){
                    _addVal=1n
                }else{
                    _addVal=0n
                }
            }
        }else if (round===1){
            if (_float.length===0){
                _addVal=0n
            }else{
                if (Number(_float[0])>5){
                    _addVal=1n
                }else if (Number(_float[0]<5)){
                    _addVal=0n
                }else{
                    if (_float==="5"||/^50+$/.test(_float)){
                        const a=Number(_int[_int.length-1])
                        if (a&1){//kisuu
                            _addVal=1n
                        }else{//guusuu
                            _addVal=0n
                        }
                    }else{
                        _addVal=1n
                    }
                }
            }
        }else if (round===2){
            if (_float.length===0){
                _addVal=0n
            }else{
                /*if (sign==="-"){
                    if (Number(_float[0])>=5){
                        _addVal=1n
                    }else{
                        _addVal=0n
                    }
                }else{
                    if (Number(_float[0])>=6||(Number(_float[0])>=5&&!(_float==="5"||/^50+$/.test(_float)))){//koyukoto?
                        _addVal=1n
                    }else{
                        _addVal=0n
                    }
                }*/
                if (Number(_float[0])>=6||(Number(_float[0])>=5&&!(_float==="5"||/^50+$/.test(_float)))){//koyukoto?
                    _addVal=1n
                }else{
                    _addVal=0n
                }
            }
        }else if (round===3){
            if (_float.length===0){
                _addVal=0n
            }else{
                if ((Number(_float[0])===0&&_float.length===1)||(/^0+$/.test(_float))){
                    _addVal=0n
                }else{
                    _addVal=1n
                }
            }
        }else if (round===4){
            _addVal=0n
        }else if (round===5){
            if (_float.length===0){
                _addVal=0n
            }else{
                if ((Number(_float[0])===0&&_float.length===1)||(/^0+$/.test(_float))){
                    _addVal=0n
                }else{
                    if (sign==="-"){
                        _addVal=0n
                    }else{
                        _addVal=1n
                    }
                }
            }
        }else if (round===6){
            if (_float.length===0){
                _addVal=0n
            }else{
                if ((Number(_float[0])===0&&_float.length===1)||(/^0+$/.test(_float))){
                    _addVal=0n
                }else{
                    if (sign==="-"){
                        _addVal=1n
                    }else{
                        _addVal=0n
                    }
                }
            }
        }else if (round===7){
            if (_float.length===0){
                _addVal=0n
            }else{
                const lastIntDig=_int[_int.length-1]||"0"
                if (lastIntDig==="0"||lastIntDig==="5"){
                    _addVal=1n
                }else{
                    _addVal=0n
               }
            }
        }
        const addVal=_addVal/**(10n**BigInt(limit))*/
        const sum=decimalsup.sum(addVal,BigInt(_int))
        const re=decimalsup.shiftLeft(sum,limit)
        if (sign==="-"&&sum===0n){
            return re
        }
        return sign+re
    }
    [Symbol.toStringTag]="decimalPack"
}
class decimalAdmin{
    [Symbol.toStringTag]="decimalAdmin"
    #target
    constructor(target_Decimal){
        if ((target_Decimal instanceof decimal)&&(target_Decimal.constructor===decimal)){
            if (target_Decimal.isDeveloperMode){
                this.#target=target_Decimal
            }else{
                throw new TypeError("this target is not developer mode.")
            }
        }else{
            throw new TypeError("can input type is decimal class.")
        }
    }
    get returnQuantize(){
        return Object.keys(this.#target.getCanUseQuantize())
    }
    returnQuantizeObject(){
        return this.#target.getCanUseQuantize()
    }
    get returnDefaultQuantize(){
        return this.#target.getDefaultQuantize()
    }
    get config(){
        return this.#target.getConfig()
    }
    get returnDefaultModMode(){
        return this.#target.getDefaultModMode()
    }
    returnModObject(){
        return this.#target.getModCanUseMode()
    }
    setConfig(path,value){
        const p=path.split(/[\.\/]/g)
        this.#target.developerModeFunctionsGate(1,[[p.slice(0,-1).join("/"),p[p.length-1],value]])
    }
    setPrec(FunctionName,value){
        const ts={
            add:"add",
            sub:"sub",
            mul:"mul",
            div:"div",
            mod:"mod",
            pow:["pow/xInt_yInt","pow/xFloat_yInt","pow/xAny_yFloat","pow/returnPrec"],
            pow_int_int:"pow/xInt_yInt",
            pow_float_int:"pow/xFloat_yInt",
            pow_any_float:"pow/xAny_yFloat",
            pow_expInt:["pow/xInt_yInt","pow/xFloat_yInt"],
            sinh:"hyp",
            cosh:"hyp",
            tanh:"hyp",
            arsinh:"hyp",
            arcosh:"hyp",
            artanh:"hyp",
            logS_set:"log",
            log10:"log",
            log2:"log",
            log:"log",
            exp:"exp",
            sin:"trig",
            cos:"trig",
            tan:"trig",
            arcsin:"trig",
            arccos:"trig",
            arctan:"trig",
            asin:"trig",
            acos:"trig",
            atan:"trig",
            trig:"trig",
            pow_return:"pow/returnPrec",
            sqrt:"sqrt",
        }
        /**@type {string|Array<string>|undefined} */
        const v=ts[FunctionName]
        if (v===undefined)return "Not Supported"
        if (typeof v==="string"){
            this.#target.developerModeFunctionsGate(1,[[v,"FloatMaxLength",value]])
        }else{
            const s=[]
            for (const va of v){
                s.push([va,"FloatMaxLength",value])
            }
            console.log(s)
            this.#target.developerModeFunctionsGate(1,s)
        }
    }
    configReset(reset=false){
        if (reset===true){
            this.#target.developerModeFunctionsGate(0)
        }
    }
    constantSet(key,value){
        const ts={
            e:"E",
            E:"E",
            LN10:"LN10",
            LN2:"LN2",
            PI:"PI",
            pi:"PI",
            PIdiv2:"PIdiv2",
            "pi/2":"PIdiv2",
            PImul2:"PImul2",
            "pi*2":"PImul2"
        }
        /**@type {string|undefined} */
        const v=ts[key]
        if (v===undefined)return "Not Supported"
        this.#target.developerModeFunctionsGate(2,[v,value])
    }
    setClassFunction(functionNode,isinstanceObject){
        this.#target.developerModeFunctionsGate(1,[["global/returnClass","classFunction",functionNode]])
    }
    setQuantize(mode){
        if (mode=="default"){
            mode=this.returnDefaultQuantize
        }
        if (typeof mode==="number"){
            const content=Object.values(this.returnQuantizeObject())
            if (!content.includes(mode))return "no index."
            this.#target.developerModeFunctionsGate(1,[["global/returnQuantize","usingFunc",mode]])
        }else if (typeof mode==="string"){
            const _mode=mode.toUpperCase()
            const val=this.returnQuantizeObject()[_mode]
            if (val){
                this.#target.developerModeFunctionsGate(1,[["global/returnQuantize","usingFunc",mode]])
            }else{
                return "no index."
            }
        }else{
            return "can input string or number."
        }
    }
    setDefaultQuantize(mode){
        if (typeof mode==="number"){
            const content=Object.values(this.returnQuantizeObject())
            if (!content.includes(mode))return "no index."
            this.#target.developerModeFunctionsGate(1,[["global/returnQuantize","default",mode]])
        }else if (typeof mode==="string"){
            const _mode=mode.toUpperCase()
            const val=this.returnQuantizeObject()[_mode]
            if (val){
                this.#target.developerModeFunctionsGate(1,[["global/returnQuantize","default",val]])
            }else{
                return "no index."
            }
        }else{
            return "can input string or number."
        }
    }
    setUsingQuantize(using){
        if (typeof using!=="boolean")return "Only Boolean."
        this.#target.developerModeFunctionsGate(1,[["global","usingQuantize",using]])
    }
    setModUsing(mode){
        if (mode==="default"){
            mode=this.returnDefaultModMode
        }
        if (typeof mode==="number"){
            const constant=Object.values(this.returnModObject())
            if (!constant.includes(mode))return "no index."
            this.#target.developerModeFunctionsGate(1,[["mod","usingFunc",mode]])
        }else if (typeof mode==="string"){
            const _mode=mode.toUpperCase()
            const val=this.returnModObject()[_mode]
            if (val){
                this.#target.developerModeFunctionsGate(1,[["mod","usingFunc",mode]])
            }else{
                return "no index."
            }
        }else{
            return "can input string or number."
        }
    }
    setDefaultModMode(mode){
        if (typeof mode==="number"){
            const content=Object.values(this.returnModObject())
            if (!content.includes(mode))return "no index."
            this.#target.developerModeFunctionsGate(1,[["mod","default",mode]])
        }else if (typeof mode==="string"){
            const _mode=mode.toUpperCase()
            const val=this.returnModObject()[_mode]
            if (val){
                this.#target.developerModeFunctionsGate(1,[["mod","default",val]])
            }else{
                return "no index."
            }
        }else{
            return "can input string or number."
        }
    }
}
class decimal{
    #developerMode=false
    #config_template
    //FloatMaxLength===prec: true
    //Length is Base10 Write!
    #config={
        add:{
            FloatMaxLength:128
        },
        sub:{
            FloatMaxLength:128
        },
        mul:{
            FloatMaxLength:64,
            karatubaConfig:{
                karatubaExecute:true,
                karatubaExecuteMinBits:4096,
            }
        },
        div:{
            FloatMaxLength:64,
            ZeroDivisionOutput:Infinity,
            ThrowZeroDivisionError:false,
        },
        mod:{
            FloatMaxLength:64,
            canUse:{
                math:0,
                lang:1,
            },
            default:1,
            usingFunc:1
        },
        log:{
            FloatMaxLength:32
        },
        pow:{
            xInt_yInt:{
                FloatMaxLength:32
            },
            xFloat_yInt:{
                FloatMaxLength:32
            },
            xAny_yFloat:{
                FloatMaxLength:32
            },
            returnPrec:{
                FloatMaxLength:32
            },
        },
        exp:{
            FloatMaxLength:32
        },
        trig:{
            FloatMaxLength:32
        },
        quantize:{
            defaultPrec:256,
        },
        sqrt:{
            FloatMaxLength:48,
        },
        global:{
            PlusCalcLength:24,
            returnClass:{
                classFunction:["String"],
                isInstanceObject:false
            },
            returnQuantize:{
                canUse:{
                    "ROUND_HALF_UP":0,
                    "ROUND_HALF_EVEN":1,
                    "ROUND_HALF_DOWN":2,
                    "ROUND_UP":3,
                    "ROUND_DOWN":4,
                    "ROUND_CEILING":5,
                    "ROUND_FLOOR":6,
                    "ROUND_05UP":7
                },
                default:0,
                usingFunc:0,
            },
            usingQuantize:true,
        },
        hyp:{
            FloatMaxLength:48,
        }
    }
    constructor(developerMode=false){
        this.#config_template=structuredClone(this.#config)
        this.#developerMode=developerMode===true
        this._returnClassFunctionUpdate()
    }
    getCanUseQuantize(){return structuredClone(this.#config.global.returnQuantize.canUse)}
    getDefaultQuantize(){return this.#config.global.returnQuantize.default}
    getModCanUseMode(){return this.#config.mod.canUse}
    get isDeveloperMode(){return this.#developerMode}
    getConfig(){return structuredClone(this.#config)}
    getDefaultModMode(){return this.#config.mod.default}
    developerModeFunctionsGate(cmd,...args){
        if (!this.#developerMode)return null
        if (cmd===0){
            //Config Reset
            this.#config=this.#config_template;
            this._returnClassFunctionUpdate()
        }
        if (cmd===1){
            //Config Setting
            //args[0]=[[path,key,value]...]
            //path(example): "pow/xInt_yInt"
            for (const [path,key,value] of args[0]){
                if (path===""||key===""||value==="")continue
                /**@type {Array<string>} */
                const p=path.split("/")
                const cp=p.reduce((prev,curr)=>prev?.[curr],this.#config)
                if (cp===undefined)continue
                cp[key]=value
            }
            this._returnClassFunctionUpdate()
        }
        if (cmd===2){
            //Constant Value Setting
            //args[0]=[key,value]
            const trueList=["E","LN10","LN2","PI","PIdiv2","PImul2"]
            if (!trueList.includes(args[0][0]))throw new RangeError("You do not have permission.")
            const p=args[0][0]
            this.#constant[p]=args[0][1]
        }
    }
    /**@type {Function} */
    #returnClassFunction/*=this.#config.global.returnClass.classFunction.reduce((prev,curr)=>prev?.[curr],globalThis)*/
    _returnClassFunctionUpdate(){
        this.#returnClassFunction=this.#config.global.returnClass.classFunction.reduce((prev,curr)=>prev?.[curr],globalThis)
    }
    quantize(val,_limit=this.#config.quantize.defaultPrec){
        const limit=_limit??this.#config.quantize.defaultPrec
        if (this.#config.global.usingQuantize){
            return decimalPack.quantize(val,limit,this.#config.global.returnQuantize.usingFunc)
        }else{
            return val
        }
    }
    #rp(V,l=null){const v=this.quantize(V,l);return this.#config.global.returnClass.isInstanceObject?new(this.#returnClassFunction(v)):this.#returnClassFunction(v)}
    add(...values){return this.#rp(this.#add_backend(...values),this.#config.add.FloatMaxLength)}
    #add_backend(...values){
        if (values.length===0)return 0
        if (values.length===1)return values[0]
        const dck=this.#config.add.FloatMaxLength+this.#config.global.PlusCalcLength
        const vdt=decimalsup.toalldp(`config:[${dck},"total::${dck}"]`,...values)
        const vsm=decimalsup.sum(0n,...vdt.map(v=>v.vint))
        return decimalsup.shiftLeft(vsm,dck)
    }
    sub(...values){return this.#rp(this.#sub_backend(...values),this.#config.sub.FloatMaxLength)}
    #sub_backend(...values){
        if (values.length===0)return 0
        if (values.length===1)return values[1]
        const dck=this.#config.sub.FloatMaxLength+this.#config.global.PlusCalcLength
        const vdt=decimalsup.toalldp(`config:[${dck},"total::${dck}"]`,...values)
        const vsm=decimalsup.sum_sub(vdt[0].vint,...vdt.slice(1).map(v=>v.vint))
        return decimalsup.shiftLeft(vsm,dck)
    }
    mul(...values){return this.#rp(this.#mul_backend(...values),this.#config.mul.FloatMaxLength)}
    #mul_backend(...values){
        const dck=this.#config.mul.FloatMaxLength+this.#config.global.PlusCalcLength
        let args=decimalsup.toalldp(`config:[${dck}]`,...values/*.map(v=>[v,dck,null])*/)
        /**@type {number} */
        let sdp=decimalsup.sum(0,...args.map(v=>v.exp??0))
        return decimalsup.shiftLeft(String(this.#mul_bigint_calc(...args)),sdp)
    }
    /**@param {...decimalPack|bigint} values @returns {bigint}*/
    #mul_bigint_calc(...values){
        /**@type {Array<bigint>} */
        const val=values.map(v=>v.vint??v)
        if (val.length===0)return 0n
        if (val.length===1)return val[0]
        if (val.length>2)return values.reduce((prev,curr)=>this.#mul_bigint_calc(prev,curr),1n)
        const n_sub=val[0]
        const m_sub=val[1]
        const n=n_sub<0n?-n_sub:n_sub
        const m=m_sub<0n?-m_sub:m_sub
        const sign=(n_sub<0n?-1n:1n)*(m_sub<0n?-1n:1n)
        const nl=n.toString(2).length
        const ml=m.toString(2).length
        if (!this.#config.mul.karatubaConfig.karatubaExecute||(nl<this.#config.mul.karatubaConfig.karatubaExecuteMinBits&&ml<this.#config.mul.karatubaConfig.karatubaExecuteMinBits)){
            return n_sub*m_sub
        }
        const shift=BigInt(Math.floor(Math.max(nl,ml)/2))
        const A=n>>shift
        const B=n%(1n<<shift)
        const C=m>>shift
        const D=m%(1n<<shift)
        const z2=this.#mul_bigint_calc(A,C)
        const z0=this.#mul_bigint_calc(B,D)
        const z1=this.#mul_bigint_calc(A+B,C+D)
        return ((z2<<(2n*shift))+((z1-z2-z0)<<shift)+z0)*sign
    }
    div(...values){return this.#rp(this.#div_backend(...values),this.#config.div.FloatMaxLength)}
    /**@param {...decimalPack|number|string|bigint} values */
    #div_backend(...values){
        const dck=this.#config.div.FloatMaxLength+this.#config.global.PlusCalcLength
        const valmin=decimalsup.toalldp(`config:[${dck}]`,...values/*.map(v=>[v,dck,null])*/).map(x=>[x.vint,x.exp])
        /**@type {Array<bigint>} */
        const val=[]
        /**@type {Array<number>} */
        const vmi=[]
        for (const [_vl,_vm] of valmin){
            val.push(_vl)
            vmi.push(_vm)
        }
        if (val.length===0)return 0
        if (val.length===1)return decimalsup.shiftLeft(val[0],vmi[0])
        const mbs=this.#mul_backend(...values.slice(1))
        if (mbs=="0"){
            if (this.#config.div.ThrowZeroDivisionError){
                throw new RangeError(`Division by zero.\nyou try:\n ${values[0]}/${mbs}\n Zero Division is not arrowed.`)
            }else{
                return this.#config.div.ZeroDivisionOutput
            }
        }
        const mdc=new decimalPack(mbs).exp
        const ndc=vmi[0]
        const dpt=Math.max(mdc,ndc)
        const mbi=BigInt(decimalsup.shiftRight(mbs,mdc))
        const nbi=BigInt(val[0])
        const res=nbi*(10n**BigInt(dpt+dck))/mbi
        return decimalsup.shiftLeft(String(res),dpt+dck+ndc-mdc)
    }
    mod(...values){
        //return this.#rp(this.#mod_backend(...values),this.#config.mod.FloatMaxLength)
        if (this.#config.mod.usingFunc===0){
            return this.modMath(...values)
        }
        if (this.#config.mod.usingFunc===1){
            return this.modLang(...values)
        }
    }
    modMath(...values){return this.#rp(this.#mod_backend_old(...values),this.#config.mod.FloatMaxLength)}
    modLang(...values){return this.#rp(this.#mod_backend(...values),this.#config.mod.FloatMaxLength)}
    #mod_backend_old(...values){//負の数がバグると思ってたけどこれが数学的には正しくてJavaScriptのモジュロ演算との定義が違うかららしい。これも使えそう
        //mod(1,2,3)-->(1%2)%3
        if (values.length===0)return 0
        if (values.length===1)return values[0]
        if (values.length>2)return values.slice(1).reduce((prev,curr)=>this.#mod_backend_old(prev,curr),values[0])
        const n=values[0]
        const m=values[1]
        const dvi=Math.floor(this.#div_backend(n,m))
        return this.#sub_backend(n,this.#mul_backend(dvi,m))
    }
    #mod_backend(...values){//latest(using ver.)
        if (values.length===0)return 0
        if (values.length===1)return values[0]
        if (values.length>2)return values.slice(1).reduce((prev,curr)=>this.#mod_backend(prev,curr),values[0])
        const n=values[0]
        const m=values[1]
        const dvi=Math.trunc(this.#div_backend(n,m))
        return this.#sub_backend(n,this.#mul_backend(dvi,m))
    }
    pow(x,y){return this.#rp(this.#pow_backend(x,y),this.#config.pow.returnPrec.FloatMaxLength)}
    #pow_backend(x,y){
        if (Number.isInteger(y)||Number.isInteger(Number(y))){
            if (Number.isInteger(x)){return this.quantize(this.#xInt_pow(x,y),this.#config.pow.xInt_yInt.FloatMaxLength+this.#config.global.PlusCalcLength)}
            else{return this.quantize(this.#xFloat_pow(x,y),this.#config.pow.xFloat_yInt.FloatMaxLength+this.#config.global.PlusCalcLength)}
        }else{return this.quantize(this.#yFloat_pow(x,y),this.#config.pow.xAny_yFloat.FloatMaxLength+this.#config.global.PlusCalcLength)}
    }
    #xInt_pow(x,y){
        const X=new decimalPack(x).vint
        let Y=new decimalPack(y).vint
        const isMinus=Y<0n?true:false
        if (isMinus)Y=-Y
        let slr=X**Y
        if (isMinus){
            slr=this.div("1",slr)
        }
        return slr
    }
    #xFloat_pow(x,y){
        const X=new decimalPack(x)
        const Y=new decimalPack(y)
        const isMinus=Y<0n?true:false
        const lst=BigInt(X.exp*y)
        let vpr=this.#div_backend(X.vint**Y.vint,10n**lst)
        if (isMinus){
            vpr=this.#div_backend("1",vpr)
        }
        return vpr
    }
    #yFloat_pow(x,y){
        const expr=this.#mul_backend(y,this.#log_backend(x))
        const epow=this.#exp_backend(expr)
        return epow
    }
    #constant={
        E:"2.7182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274274663919320030599218174135966290435729003342952605956307381323286279434907632338298807531952510190115738341879307021540891499348841675092447614606680822648001684774118537423454424371075390777449920695517027618386062613313845830007520449338265602976067371132019220504046269954760598103857083582685724245415069595082953311686172785588907509838175463746493931925506040092770167113900984882401285836160356370766010471018194295559619894676783744944825537977472684710404753464620804668425906949129331367702898915210475216205696602405803815019351125338243003558764024749647326391419927260426992279678235478163600934172164121992458631503028618297455570674983850549458858692699569092721079750930295532116534498720275596023648066549911988183479775356636980742654252786255181841757467289097777279380008164706001614524919217321721477235014144197356854816136115735255213347574184946843852332390739414333454776241686251898356948556209921922218427255025425688767179049460165346680498862723279178608578438382796797668145410095388378636095068006422512520511739298489608412848862694560424196528502221066118630674427877549094699318899412322932832699257481359810022865911210249013509",
        LN10:"2.30258509299404568401799145468436420760110148862877297603332790096757260967735248023599720508959829834196778404228624863340952546508280675666628736909878168948290720832555468084379989482623319852839350530896537773262884616336622228769821988674654366747440424327436515504893431493939147961940440022210510171417480036880840126470806855677432162283552201148046637156591213734507478569476834636167921018064450706480002775026849167465505868569356734206705811364292245544057589257242082413146956890167589402567763113569192920333765871416602301057030896345720754403708474699401682692828084811842893148485249486448719278096762712757753970276686059524967166741834857044225071979650047149510504922147765676369386629769795221107182645497347726624257094293225827985025855097852653832076067263171643095059950878075237103331011978575473315414218084275438635917781170543098274823850456480190956102992918243182375253577097505395651876975103749708886921802051893395072385392051446341972652872869651108625714921988499787489",
        LN2:"0.693147180559945309417232121458176568075500134360255254120680009493393621969694715605863326996418687542001481020570685733685520235758130557035266554067171715774078532004335598201783795432304674930331932336293442707027271457174845504151921144216817445452203085287691561893003010519041002030753959193902432845523995133259916465452424750651012565138133525175169829102400705475326438125883484435641730522714584483753590596881265836523930636376674449984337237365313303305951129330414131785869159740440856185632006214526527921339864192728780611644715445963287040529813011944679815076041530134705228253258952404981144802976003310322764475431031351177655815325140528590390947562688653248357453367003463137361100643632142104642382777303022533026548721055613689327230692147064120624327210947718157563140230548599979991248410592572427161102981366332593977245618494250227106352251276949257039826111928531429715508301505139069150593024565115351636203204471017713838388474251869123348946231508191063074023345172675214256656361212389148797341952433434742331295984224355228846385350230785044774899385591500304206047147766914711422513981144851270123516345",
        PI:"3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989",
        PIdiv2:"1.570796326794896619231321691639751442098584699687552910487472296153908203143104499314017412671058533991074043256641153323546922304775291115862679704064240558725142051350969260552779822311474477465190982214405487832966723064237824116893391582635600954572824283461730174305227163324106696803630124570636862293503303157794087440760460481414627045857682183946295180005665265274410233260692073475970755804716528635182879795976546093058690966305896552559274037231189981374783675942876362445613969091505974564916836681220328321543010697473197612368595351089930471851385269608588146588376192337409233834702566000284063572631780413892885671378894804586818589360734220450612476715073274792685525396139844629461771009978056064510980432017209079906814887385654980259353605674999999186489024975529865866408048159297512229727673454151321261154126672342517630965594085050015689193764432937666041907103085888345736517991267452143777343655797814319411768937968759788909288902660856134033065009639383055979546082100994",
        PImul2:"6.2831853071795864769252867665590057683943387987502116419498891846156328125724179972560696506842341359642961730265646132941876892191011644634507188162569622349005682054038770422111192892458979098607639288576219513318668922569512964675735663305424038182912971338469206972209086532964267872145204982825474491740132126311763497630418419256585081834307287357851807200226610610976409330427682939038830232188661145407315191839061843722347638652235862102370961489247599254991347037715054497824558763660238982596673467248813132861720427898927904494743814043597218874055410784343525863535047693496369353388102640011362542905271216555715426855155792183472743574429368818024499068602930991707421015845593785178470840399122242580439217280688363196272595495426199210374144226999999967459560999021194634656321926371900489189106938166052850446165066893700705238623763420200062756775057731750664167628412343553382946071965069808575109374623191257277647075751875039155637155610643424536132260038557532223918184328403978",
    }
    get E(){return this.#constant.E}
    get LN10(){return this.#constant.LN10}
    get LN2(){return this.#constant.LN2}
    get PI(){return this.#constant.PI}
    get PIdiv2(){return this.#constant.PIdiv2}
    get PImul2(){return this.#constant.PImul2}
    /**@type {Array<string>} */
    #log_S=[]
    #ln_Si=[]
    logS_set(){
        const res=[]
        const rsl=[]
        for (let i=0;i<64;i++){
            const I=this.#sub_backend(1,this.#pow_backend(2,-(i+1)))
            res.push(I)
            rsl.push(this.#ln_o(I))
        }
        this.#log_S=res
        this.#ln_Si=rsl
    }
    #ln_o(z){
        let num=this.#sub_backend(z,1)
        let den=this.#add_backend(z,1)
        let x=this.#div_backend(num,den)
        let a=this.#artanh_backend(x)
        return this.#mul_backend(2,a)
    }
    #log_ts(n){
        if(1<=n&&n<1.25)return 1
        if(1.25<=n&&n<1.5)return 0.8
        if(1.5<=n&&n<1.75)return 0.67
        if(1.75<=n&&n<2)return 0.58
        if(2<=n&&n<2.25)return 0.5
        if(2.25<=n&&n<2.5)return 0.45
        if(2.5<=n&&n<2.75)return 0.4
        if(2.75<=n&&n<3)return 0.37
        if(3<=n&&n<3.25)return 0.34
        if(3.25<=n&&n<3.5)return 0.31
        if(3.5<=n&&n<3.75)return 0.28
        if(3.75<=n&&n<4)return 0.27
        if(4<=n&&n<4.25)return 0.25
        if(4.25<=n&&n<4.5)return 0.24
        if(4.5<=n&&n<4.75)return 0.23
        if(4.75<=n&&n<5)return 0.22
        if(5<=n&&n<5.25)return 0.2
        if(5.25<=n&&n<5.75)return 0.19
        if(5.75<=n&&n<6)return 0.18
        if(6<=n&&n<6.25)return 0.17
        if(6.25<=n&&n<6.75)return 0.16
        if(6.75<=n&&n<7.25)return 0.15
        if(7.25<=n&&n<7.75)return 0.14
        if(7.75<=n&&n<8.5)return 0.13
        if(8.5<=n&&n<9.25)return 0.12
        if(9.25<=n&&n<10)return 0.11
        if(10<n)return 0.1
        throw new RangeError("Input is 1~10 range only.\nInput Data:"+n)
    }
    log(n){return this.#rp(this.#log_backend(n),this.#config.log.FloatMaxLength)}
    #log_backend(n){
        if (this.#log_S.length===0)this.logS_set()
        const dck=this.#config.log.FloatMaxLength+this.#config.global.PlusCalcLength
        const nb=new decimalPack(n,dck)
        const k=this.#log_ts(Number(nb.d10$x_d))
        let zk=this.#mul_backend(nb.d10$x_d,k)
        let zsk=this.#ln_o(k)
        for (let i=0;i<64;i++){
            const test=this.#mul_backend(zk,this.#log_S[i])
            if (test>=1){
                zk=test
                zsk=this.#add_backend(zsk,this.#ln_Si[i])
            }
        }
        const o=this.#artanh_backend(this.#div_backend(this.#sub_backend(zk,1),this.#add_backend(zk,1)))
        return this.#add_backend(
            this.#sub_backend(this.#mul_backend(2,o),zsk),
            this.#mul_backend(nb.d10$x_exp,this.#constant.LN10)
        )
    }
    log10(n){
        return this.#rp(this.#div_backend(this.#log_backend(n),this.#constant.LN10),this.#config.log.FloatMaxLength)
    }
    log2(n){
        return this.#rp(this.#div_backend(this.#log_backend(n),this.#constant.LN2),this.#config.log.FloatMaxLength)
    }
    numToNln2r(x){return {n:Math.floor(this.#div_backend(x,this.#constant.LN2)),r:this.#mod_backend(x,this.#constant.LN2)}}
    numToNln10r(x){return {n:Math.floor(this.#div_backend(x,this.#constant.LN10)),r:this.#mod_backend(x,this.#constant.LN10)}}
    numTo2Nr(x){return {n:Math.floor(this.#div_backend(x,2)),r:this.#mod_backend(x,2)}}
    numTo10Nr(x){return {n:Math.floor(this.#div_backend(x,10)),r:this.#mod_backend(x,10)}}
    exp(x){return this.#rp(this.#exp_backend(x),this.#config.exp.FloatMaxLength)}
    #exp_backend(x){
        const dck=this.#config.exp.FloatMaxLength+this.#config.global.PlusCalcLength

        const xdp=new decimalPack(x)
        const ldp=new decimalPack(this.#constant.LN2.slice(0,dck+32))
        const R=this.#mod_backend(x,ldp)
        const N=this.#div_backend(this.#sub_backend(x,R),ldp)
        let now="1"
        let n=1n
        let frac_now=1n
        let rPow=R
        while (true){
            let ads=(this.#div_backend(rPow,frac_now))
            now=this.#add_backend(now,ads)
            if (Math.abs(Number(decimalsup.shiftRight(ads,dck)))<1)break
            rPow=this.#mul_backend(rPow,R)
            n++
            frac_now*=n
        }
        const pw=this.#xInt_pow(2,N)
        return this.#mul_backend(pw,now)
    }
    sin(theta){return this.#rp(this.#sin_backend(theta),this.#config.trig.FloatMaxLength)}
    #sin_backend(_){
        const dck=this.#config.trig.FloatMaxLength+this.#config.global.PlusCalcLength
        const x=new decimalPack(this.#mod_backend(_,this.#constant.PImul2),dck)
        let n=0
        let x_2n_1=x
        const x2=this.#mul_backend(x,x)
        let _2n_1_Frac=1
        let now="0"
        let pm=1
        while (true){
            const test=this.#div_backend(x_2n_1,_2n_1_Frac)
            now=this.#add_backend(now,this.#mul_backend(pm,test))
            if (Math.abs(Number(decimalsup.shiftRight(test,dck)))<1)break
            n++
            x_2n_1=this.#mul_backend(x_2n_1,x2)
            _2n_1_Frac=this.#mul_backend(_2n_1_Frac,2*n,2*n+1)
            pm=-pm
        }
        return now
    }
    cos(theta){return this.#rp(this.#cos_backend(theta),this.#config.trig.FloatMaxLength)}
    #cos_backend(_){
        return this.#sin_backend(this.#sub_backend(this.#constant.PIdiv2,_))
    }
    tan(theta){return this.#rp(this.#tan_backend(theta),this.#config.trig.FloatMaxLength)}
    #tan_backend(_){
        return this.#div_backend(this.#sin_backend(_),this.#cos_backend(_))
    }
    #sqrtConstant={"$0":"0","$0_1":"3.16227766016837933199889354443274","$0_2":"2.23606797749978969640917366873125","$0_3":"1.82574185835055371152323260933601","$0_4":"1.58113883008418966599944677221637","$0_5":"1.4142135623730950488016887242097","$0_6":"1.29099444873580562839308846659413","$0_7":"1.19522860933439363996881717969312","$0_8":"1.11803398874989484820458683436564","$0_9":"1.0540925533894597773329645148109","$1":"1","$1_1":"0.95346258924559231544677592152721","$1_2":"0.91287092917527685576161630466801","$1_3":"0.87705801930702921472003771197443","$1_4":"0.84515425472851657750961832736595","$1_5":"0.81649658092772603273242802490196","$1_6":"0.79056941504209483299972338610818","$1_7":"0.76696498884737043700976135969755","$1_8":"0.74535599249992989880305788957709","$1_9":"0.72547625011001167199767960804917","$2":"0.70710678118654752440084436210485","$2_1":"0.69006555934235421779612686462713","$2_2":"0.67419986246324208624649067643643","$2_3":"0.65938047339578700471798482054627","$2_4":"0.64549722436790281419654423329707","$2_5":"0.63245553203367586639977870888654","$2_6":"0.6201736729460422809512779407926","$2_7":"0.608580619450184570507744203112","$2_8":"0.59761430466719681998440858984656","$2_9":"0.58722021951470348848735592496129","$3":"0.57735026918962576450914878050196","$3_1":"0.56796183424706481115384607020957","$3_2":"0.55901699437494742410229341718282","$3_3":"0.55048188256318030280409687449422","$3_4":"0.54232614454664043000013378128016","$3_5":"0.53452248382484876936910696175951","$3_6":"0.52704627669472988866648225740545","$3_7":"0.51987524491003634464473953841117","$3_8":"0.51298917604257704772833753683682","$3_9":"0.50636968354183330813944771906982","$4":"0.5","$4_1":"0.49386479832479480324992444609515","$4_2":"0.48795003647426658967719231812005","$4_3":"0.48224282217041211336183690232209","$4_4":"0.47673129462279615772338796076361","$4_5":"0.47140452079103168293389624140323","$4_6":"0.46625240412015688281800694226758","$4_7":"0.46126560401444254082956647831345","$4_8":"0.456435464587638427880808152334","$4_9":"0.45175395145262561885698479206182","$5":"0.44721359549995793928183473374625","$5_1":"0.44280744277004764411216666391551","$5_2":"0.43852900965351460736001885598721","$5_3":"0.43437224276306936682921539366419","$5_4":"0.43033148291193520946436282219804","$5_5":"0.42640143271122086859687546486768","$5_6":"0.42257712736425828875480916368297","$5_7":"0.41885390829169550698134148446112","$5_8":"0.41522739926869984414235313897857","$5_9":"0.41169348479630912609393376942276","$6":"0.40824829046386301636621401245098","$6_1":"0.40488816508945800096837696092275","$6_2":"0.40160966445124943144632163441233","$6_3":"0.39840953644479787998960572656438","$6_4":"0.39528470752104741649986169305409","$6_5":"0.39223227027636806384832493146329","$6_6":"0.38924947208076148545808783265576","$6_7":"0.38633370464312789763217079565649","$6_8":"0.38348249442368521850488067984878","$6_9":"0.38069349381344049701071335434749","$7":"0.37796447300922722721451653623418","$7_1":"0.37529331252040078321031825187029","$7_2":"0.37267799624996494940152894478855","$7_3":"0.37011660509880263098283333855985","$7_4":"0.3676073110469038741899983073529","$7_5":"0.3651483716701107423046465218672","$7_6":"0.36273812505500583599883980402458","$7_7":"0.36037498507822358303220075184704","$7_8":"0.35805743701971644025343396259196","$7_9":"0.35578403348241002568421707163173","$8":"0.35355339059327376220042218105242","$8_1":"0.35136418446315325911098817160363","$8_2":"0.34921514788478910132779515197643","$8_3":"0.34710506725031165049417152593935","$8_4":"0.34503277967117710889806343231357","$8_5":"0.34299717028501767475730311044386","$8_6":"0.34099716973523674755866258248778","$8_7":"0.33903175181040519159411916326503","$8_8":"0.33709993123162104312324533821821","$8_9":"0.33520076157699545538332624565839","$9":"0.33333333333333333333333333333333","$9_1":"0.33149677206589793596172268598455","$9_2":"0.32969023669789350235899241027313","$9_3":"0.3279129178919764782112253338712","$9_4":"0.32616403652672109907561025513983","$9_5":"0.32444284226152507632895749376075","$9_6":"0.32274861218395140709827211664853","$9_7":"0.32108064953396777251770185295603","$9_8":"0.3194382824999699566298819526759","$9_9":"0.31782086308186410514892530717574","$10":"0.31622776601683793319988935444327","$12":"0.28867513459481288225457439025098","$14":"0.26726124191242438468455348087975","$16":"0.25","$18":"0.23570226039551584146694812070162","$20":"0.22360679774997896964091736687313","$22":"0.21320071635561043429843773243384","$24":"0.20412414523193150818310700622549","$26":"0.19611613513818403192416246573165","$28":"0.18898223650461361360725826811709","$30":"0.1825741858350553711523232609336","$32":"0.17677669529663688110021109052621","$34":"0.17149858514250883737865155522193","$36":"0.16666666666666666666666666666667","$38":"0.16222142113076253816447874688037","$40":"0.15811388300841896659994467722164","$42":"0.154303349962091910261094462764","$44":"0.15075567228888181132340603348503","$46":"0.14744195615489713345792513753535","$48":"0.14433756729740644112728719512549","$50":"0.14142135623730950488016887242097","$52":"0.13867504905630728050458543336425","$54":"0.13608276348795433878873800415033","$56":"0.13363062095621219234227674043988","$58":"0.13130643285972255664933467288204","$60":"0.12909944487358056283930884665941","$62":"0.127000127000190500317500555626","$64":"0.125","$66":"0.12309149097933273273424066012524","$68":"0.12126781251816648675945323105806","$70":"0.11952286093343936399688171796931","$72":"0.11785113019775792073347406035081","$74":"0.11624763874381928069904693966283","$76":"0.11470786693528088295360478904894","$78":"0.11322770341445957506107747085845","$80":"0.11180339887498948482045868343656","$82":"0.11043152607484654422650985569493","$84":"0.10910894511799619063304874270781","$86":"0.10783277320343841572693507062779","$88":"0.10660035817780521714921886621692","$90":"0.10540925533894597773329645148109","$92":"0.10425720702853738133907474052528","$94":"0.10314212462587934072498809734942","$96":"0.10206207261596575409155350311275","$98":"0.10101525445522107491440633744355","$100":"0.1"}
    #sqrt_ts(a){
        return this.#sqrtConstant["$"+(Math.ceil(10*a)/10).toString().replace(".","_")]??(this.#sqrtConstant["$"+(Math.floor(10*a)/10).toString().replace(".","_")]??NaN)
    }
    sqrt(A){return this.#rp(this.#sqrt_backend(A),this.#config.sqrt.FloatMaxLength)}
    #sqrt_backend(A){
        const dck=this.#config.sqrt.FloatMaxLength+this.#config.global.PlusCalcLength+64
        const a=new decimalPack(A,dck)
        let exp=0
        let d=""
        if ((a.d10$x_exp&1)===1){//kisuu
            exp=a.d10$x_exp-1
            d=decimalsup.shiftRight(a.d10$x_d,1)/*this.#mul_backend(a.d10$x_d,10)*/
        }else{
            exp=a.d10$x_exp
            d=a.d10$x_d
        }
        let x_n=this.#sqrt_ts(d)
        for (let i=0;i<Math.log2(dck)+1;i++){
            x_n=this.#mul_backend(x_n,this.#div_backend(this.#sub_backend(3,this.#mul_backend(d,this.#pow_backend(x_n,2))),2))
        }
        //const re=this.#mul_backend(x_n,d,this.#pow_backend(10,this.#div_backend(exp,2)))
        const re=decimalsup.shiftRight(this.#mul_backend(x_n,d),this.#div_backend(exp,2))
        return re
    }
    sinh(a){return this.#rp(this.#sinh_backend(a),this.#config.hyp.FloatMaxLength)}
    #sinh_backend(_){
        const ex=this.#exp_backend(_)
        const emx=this.#exp_backend(this.#mul_backend(_,-1))
        return this.#div_backend(this.#sub_backend(ex,emx),2)
    }
    cosh(a){return this.#rp(this.#cosh_backend(a),this.#config.hyp.FloatMaxLength)}
    #cosh_backend(_){
        const ex=this.#exp_backend(_)
        const emx=this.#exp_backend(this.#mul_backend(_,-1))
        return this.#div_backend(this.#add_backend(ex,emx),2)
    }
    tanh(a){return this.#rp(this.#tanh_backend(a),this.#config.hyp.FloatMaxLength)}
    #tanh_backend(_){
        return this.#div_backend(this.#sinh_backend(_),this.#cosh_backend(_))
    }
    arsinh(a){return this.#rp(this.#arsinh_backend(a),this.#config.hyp.FloatMaxLength)}
    #arsinh_backend(x){
        const dck=this.#config.hyp.FloatMaxLength+this.#config.global.PlusCalcLength
        const xsq=this.#sqrt_backend(this.#add_backend(this.#mul_backend(x,x),1))
        const res=this.#log_backend(this.#add_backend(x,xsq))
        return res
    }
    arcosh(a){return this.#rp(this.#arcosh_backend(a),this.#config.hyp.FloatMaxLength)}
    #arcosh_backend(x){
        const dck=this.#config.hyp.FloatMaxLength+this.#config.global.PlusCalcLength
        const xsq=this.#sqrt_backend(this.#sub_backend(this.#mul_backend(x,x),1))
        const res=this.#log_backend(this.#add_backend(x,xsq))
        return res
    }
    artanh(a){return this.#rp(this.#artanh_backend(a),this.#config.hyp.FloatMaxLength)}
    #artanh_backend(x,limit=this.#config.hyp.FloatMaxLength+this.#config.global.PlusCalcLength){
        let now=0
        let n=1
        const x2=this.#pow_backend(x,2)
        let xPow=x
        while (true){
            let ads=this.#div_backend(xPow,2*n-1)
            now=this.#add_backend(now,ads)
            if (Math.abs(Number(decimalsup.shiftRight(ads,limit)))<1)break
            xPow=this.#mul_backend(xPow,x2)
            n++
        }
        return now
    }
    arcsin(a){return this.#rp(this.#arcsin_backend(a),this.#config.trig.FloatMaxLength)}
    #arcsin_backend(_){
        const x2=this.#mul_backend(_,_)
        const sqv=this.#sqrt_backend(this.#sub_backend(1,x2))
        return this.#arctan_backend(this.#div_backend(_,sqv))
    }
    arccos(a){return this.#rp(this.#arccos_backend(a),this.#config.trig.FloatMaxLength)}
    #arccos_backend(_){
        return this.#sub_backend(this.#constant.PIdiv2,this.#arcsin_backend(_))
    }
    arctan(a){return this.#rp(this.#arctan_backend(a),this.#config.trig.FloatMaxLength)}
    #arctan_backend(_){
        const dck=this.#config.trig.FloatMaxLength+this.#config.global.PlusCalcLength
        const x=new decimalPack(_,dck)
        let n=0
        let x_2n_1=x
        const x2=this.#mul_backend(x,x)
        let now="0"
        let pm=1
        while (true){
            const k=2*n+1
            const test=this.#div_backend(x_2n_1,k)
            now=this.#add_backend(now,this.#mul_backend(pm,test))
            if (Math.abs(Number(decimalsup.shiftRight(test,dck)))<1)break
            n++
            x_2n_1=this.#mul_backend(x_2n_1,x2)
            pm=-pm
        }
        return now
    }
    static get about(){
        return {
            version:"3.0",
            detailVersion:"3.1.5",
            devVersion:"5",
            fullName:"Decimal Math Calculate System for JavaScript",
            name:"decimal3.0.mjs",
            fileName:"decimal3.0.mjs",
            allVersions:["1.0","2.0","2.1","3.0","3.1"],
            license:"GPL-2.0 License",
            scriptAbout:{
                classAbout:{
                    decimalsup:{
                        version:"2.0",
                        detailVersion:"2.0.53",
                        oldName:"decimal_support",
                    },
                    decimalPack:{
                        version:"5.8",
                        detailVersion:"5.8.8",
                        oldName:"_decimal_pack",
                    },
                    decimal:{
                        version:"3.0",
                        detailVersion:"3.1.39",
                        oldName:"decimalMath",
                    },
                    decimalAdmin:{
                        version:"1.0",
                        detailVersion:"1.0.25",
                        oldName:"decimalAdmin"
                    }
                }
            }
        }
    }
    [Symbol.toStringTag]="decimal3.0"
}
globalThis._decimalsup=decimalsup
globalThis._decimalPack=decimalPack
globalThis.decimal=decimal
globalThis.decimalAdmin=decimalAdmin
export default decimal
export {decimalsup,decimalPack,decimal,decimalAdmin}