import { EasyError } from '../error/error'

export interface IValidation 
{
    value : string | number | unknown[] | Record<string, unknown>
}

export interface IValidationError
{
    paramName: string
    condition: string
    data: string
}

export type CheckFunction = {
    errorMessage?: string
    (val: unknown): boolean
}

export const Validate = (val: unknown, validator: CheckFunction|_validator): void=>
{
    const fct: CheckFunction = validator instanceof _validator ? validator.GetFunction() : validator
    if (!fct(val))
    {
        throw (new EasyError(400, `Validation error: ${JSON.stringify(val)}  ${fct.errorMessage} `))
    }
}

const NewValidationFunction = (errorMessage: string, fct: CheckFunction) => 
{
    fct.errorMessage = errorMessage
    return fct
}

export const EasyValidatorEx = {

    Not: (fct: CheckFunction): CheckFunction => {
        return NewValidationFunction(`NOT : \n ${fct.errorMessage}`, (val: unknown) => {return !fct(val)})
    },
    Equal : (val2: unknown): CheckFunction => {
        return NewValidationFunction( `equal to ${typeof val2 === 'string'?`"${val2}"` :val2}`, (val: unknown): boolean => {return val === val2})
    },
    GreaterThan: (val2: number): CheckFunction => {
        return NewValidationFunction( `greater than ${val2}`, (val: unknown): boolean => {return val > val2})
    },
    GreaterOrEqual: (val2: number): CheckFunction => {
        return NewValidationFunction( `greater than or equal to ${val2}`, (val: unknown): boolean => {return val >= val2})
    },
    LessThan: (val2: number): CheckFunction => {
        return NewValidationFunction( `less than ${val2}`, (val: unknown): boolean => {return val < val2})
    },
    LessOrEqual: (val2: number): CheckFunction => {
        return NewValidationFunction( `less than or equal to ${val2}`, (val: unknown): boolean => {return val <= val2})
    },
    Between: (minVal: number, maxVal: number): CheckFunction => {
        return NewValidationFunction( `between ${minVal} and ${maxVal}`, (val: unknown): boolean => {return val <= maxVal && val >= minVal}) 
    },
    IsOfType: (val2: string): CheckFunction =>
    {
        return NewValidationFunction( `of type ${val2}`, (val: unknown): boolean => {return typeof val === val2})
    },
    IsNumber: (): CheckFunction =>
    {
        return EasyValidatorEx.IsOfType('number')
    },
    IsString: (length = -1): CheckFunction =>
    {
        
        if (length >= 0)
        {
            return NewValidationFunction(`a string of length: ${length}`, (val: unknown): boolean => {
                return (typeof val === 'string' && (val as string).length === length)
            })
        }
        return EasyValidatorEx.IsOfType('string')
        
    },
    IsObject: (): CheckFunction =>
    {
        return EasyValidatorEx.IsOfType('object')
    },
    IsArray: (length = -1): CheckFunction =>
    {
        const lengthDescription = length >= 0? `of minimal lengh: ${length}`: ''
        const description = `an array ${lengthDescription}`
        return NewValidationFunction( description, (val: unknown): boolean => {
            return (Array.isArray(val) && 
            (length < 0 || (val as unknown[]).length >= length)
            )})
    },
    HasProperties: (properties: string[]): CheckFunction =>
    {
        return NewValidationFunction( `have properties: ${JSON.stringify(properties)}`, (val: unknown): boolean => {
            return properties.every((propertyName) => propertyName in (val as Record<string, unknown>))
        })
    },
    And: (fcts: CheckFunction[]) : CheckFunction =>
    {
        let description = 'AND : '
        fcts.forEach((fct) => {
            description += `\n- ${fct.errorMessage} `
        })
        return NewValidationFunction( description, (val: unknown): boolean => {return fcts.every((fct) => fct(val))})   
    },
    Or: (fcts: CheckFunction[]) : CheckFunction =>
    {
        let description = 'OR : '
        fcts.forEach((fct) => {
            description += `\n- ${fct.errorMessage} `
        })
        return NewValidationFunction( description, (val: unknown): boolean => {return fcts.some((fct) => fct(val))})   
    },
    True: (): CheckFunction =>
    {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return NewValidationFunction( '', (val: unknown): boolean => {return true})
    }
    
}
export class _validator 
{
    private instructions: CheckFunction[]
    private not: boolean

    constructor()
    {
        this.instructions = []
    }

    public GetFunction(): CheckFunction
    {
        if (this.instructions.length > 1) return EasyValidatorEx.And(this.instructions)

        if(this.instructions.length == 1) return this.instructions[0]

        return EasyValidatorEx.True()
    }   

    public Eval = (val: unknown) =>
    {
        return this.GetFunction()(val)
    }

    private addInstruction = (fct: CheckFunction) =>
    {
        if (this.not)
        {
            fct = EasyValidatorEx.Not(fct)
            this.not = false
        }
        this.instructions.push(fct)
    }

    public Equal = (val: unknown): _validator =>
    {
        this.addInstruction(EasyValidatorEx.Equal(val))
        return this
    } 

    public GreaterThan = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.GreaterThan(val))
        return this
    } 

    public GreaterOrEqual = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.GreaterOrEqual(val))
        return this
    } 

    public LessThan = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.LessThan(val))
        return this
    } 

    public LessOrEqual = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.LessOrEqual(val))
        return this
    } 

    public Between = (minVal: number, maxVal: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.Between(minVal, maxVal))
        return this
    }

    public IsOfType = (val: string): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsOfType(val))
        return this
    }

    public IsNumber = (): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsOfType('number'))
        return this
    }

    public IsString = (length = -1): _validator =>
    {
        
        this.addInstruction(EasyValidatorEx.IsString(length))
        return this
    }
    
    public IsObject = (): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsOfType('object'))
        return this
    }

    public IsArray = (length = -1): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsArray(length))
        return this
    }

    public HasProperties = (properties: string[]): _validator =>
    {
        this.addInstruction(EasyValidatorEx.HasProperties(properties))
        return this
    }

    public get Not(){
        this.not = !this.not
        return this       
    }

}

export const EasyValidator = (): _validator =>
{
    return new _validator()
}