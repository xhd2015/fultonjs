
import { Readable } from "stream";
import * as fs from "fs/promises"

export async function readStdin(): Promise<string> {
    return readAll(process.stdin)
}
export async function parseStdinJSON<T>(): Promise<T> {
    return JSON.parse(await readStdin())
}

// if the file is treated as a config, it can be optional
export async function parseFileJSONOptional<T>(file: string): Promise<T | undefined> {
    try {
        return parseFileJSON(file)
    } catch (e) {
        return undefined
    }
}
export async function parseFileJSON<T>(file: string): Promise<T> {
    const data = await fs.readFile(file, { encoding: "utf-8" })
    return JSON.parse(data)
}

export async function readAll(readable: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks = []
        readable.on('data', e => {
            chunks.push(e)
        })
        readable.on('error', err => {
            reject(err)
        })
        readable.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf-8'))
        })
    })
}