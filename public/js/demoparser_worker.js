import init, * as demoparser from '../lib/demoparser/demoparser2.js'

await init().then((e) => {
  console.log('Demoparser WASM worker loaded')
})

self.onmessage = async function (e) {
  const {cmd, file, wantedPropsOrEventNames = [], ticksOrPlayerProps = [], playersOrOtherProps = [], structOfArrays = false} = e.data

  if(!demoparser[cmd]){
    console.error(`Unknown command ${cmd}`)
  }

  const startTime = Date.now()
  const result = demoparser[cmd](
    file,
    wantedPropsOrEventNames, 
    ticksOrPlayerProps, 
    playersOrOtherProps, 
    structOfArrays
  )
  const duration = Date.now() - startTime
  postMessage({ type: 'result', result, duration })
}
