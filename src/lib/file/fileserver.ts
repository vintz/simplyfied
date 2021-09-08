import { ServerResponse } from 'http'
import * as Path from 'path'
import * as Fs from 'fs'
import * as Mime from 'mime-types'
import { SimpleError } from '../error/error'

export const isSubPath = (mainPath: string, currentPath: string): boolean => {
    const combined = Path.join(mainPath, currentPath)
    return !!combined && combined.startsWith(Path.join(mainPath))
}

export const fileServer = (mainPath: string): {mainPath: string, getFile:(path: string, res: ServerResponse) => void} => {
    return {
        mainPath: Path.resolve(mainPath),
        getFile: (path: string, res: ServerResponse): Promise<void> =>{
            return new Promise<void>((resolve, reject) => {
                const realMainPath = Path.resolve(mainPath)
                if (isSubPath(realMainPath, path))
                {
                    const fullPath = Path.join(realMainPath, path)
                    Fs.stat(fullPath, (err, stat)=>{
                        if (err)
                        {
                            reject(SimpleError.BadRequest('Unable to open file', err.message))
                            return 
                        }
                        if (stat.isDirectory())
                        {
                            reject(SimpleError.BadRequest('File not found'))
                            return 
                        }
                        const mType = Mime.contentType(fullPath)

                        res.writeHead(200, {
                            'Content-Type': mType? mType: '',
                            'Content-Length': stat.size
                        })
                    
                        const readStream = Fs.createReadStream(fullPath)
                        const tmp = readStream.pipe(res)
                        tmp.on('finish', ()=>{resolve()})
                    })
                }
                else 
                {
                    reject(SimpleError.BadRequest('Illegal path'))
                    return 
                }
            })
        }
    }

} 