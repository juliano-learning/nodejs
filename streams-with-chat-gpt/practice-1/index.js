'use strict'

const {
  createReadStream,
  createWriteStream,
  open,
  constants,
  write,
  promises: fsPromises,
} = require('node:fs')
const {pipeline, Writable} = require('node:stream')
const {inspect} = require('node:util')

const readStream = createReadStream(__dirname + '/practice-1.txt', {
  encoding: 'utf-8',
})

// const writeStream = createWriteStream('practice-1.copy.txt')

class MyStream extends Writable {
  constructor(fileName, options) {
    super(options)
    this.fileName = fileName
    this.file = null
    this.brokenWord = ''
    this.count = 0
  }

  async _construct(cb) {
    await this.openFile()
  }

  async openFile() {
    try {
      this.file = await fsPromises.open(
        this.fileName,
        constants.O_CREAT | constants.O_WRONLY
      )
    } catch (e) {
      console.log('Could not open the file')
      throw e
    }
  }

  _write(chunk, encoding, cb) {
    const content = chunk.toString()
    let byParagraph = content.split('\n')

    byParagraph = byParagraph.map((p, index) => {
      let byWord = p.split(' ')
      if(!index && this.brokenWord) {
        byWord[0] = this.brokenWord + byWord[0]
        this.brokenWord = ''
      }

      if (index === byParagraph.length - 1 && !(p.endsWith('\n') || p.endsWith(' '))) {
        this.brokenWord += byWord.pop()
      }

      byWord = byWord.map(v => {
        const splitted = v.split('')
        splitted.reverse()
        return splitted.join('')
      })

      if (content.endsWith(' ')) {
        byWord[byWord.length - 1] += ' '
      }

      return byWord.join(' ')
    })

    this.file.write(byParagraph.join('\n'))
    cb()
  }

  _final(cb) {
    cb(this.brokenWord)
  }
}

const writeStream = new MyStream(__dirname + '/practice-1.copy.txt', {
  highWaterMark: 2000,
})

pipeline(readStream, writeStream, err => {
  if (err) {
    console.log('Something really bad happened', err)
  } else {
    console.log('Successfully copied the file')
  }
})
