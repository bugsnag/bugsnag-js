import { ncp } from 'ncp'
import { mkdir } from 'fs'
import rimraf from 'rimraf'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

export const prepareFixture = async (fixture: string) => {
  const tmp = `${__dirname}/../.tmp${uuidv4()}`

  const target = `${tmp}/${fixture}`

  // create target directory
  await promisify(mkdir)(target, { recursive: true })

  // copy in the desired fixture
  await promisify(ncp)(`${__dirname}/../fixtures/${fixture}`, target)

  // give the target path and a clean up function to the caller
  return { target, clean: async () => promisify(rimraf)(tmp) }
}
