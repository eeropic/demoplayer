const demoparserWorker = new Worker("./js/demoparser_worker.js", {
  type: "module",
})

const fileInput = document.querySelector(".file-input")

const setProgressBar = ({ time = 0, value = 100 } = {}) =>
  (fileInput.style = `transition: ${
    time ? `--progress-pos ${time}ms linear` : "none"
  }; --progress-pos: ${value}%`)

const msToSeconds = (ms, d) => (ms / 1000).toFixed(d)

let scene, camera, renderer, controls

function createGrid(scene) {
  const size = 100
  const divisions = 64

  const gridColorCenterLine = 0xffffff

  const gridHelper = new THREE.GridHelper(
    size,
    divisions,
    gridColorCenterLine,
  )

  gridHelper.rotation.x = -Math.PI / 2
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;

  scene.add(gridHelper)
}

function setupThree() {
  scene = new THREE.Scene()
  scene.rotation.x = Math.PI / 2
  scene.scale.z = -1
  scene.scale.y = -1

  createGrid(scene)

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.querySelector(".map-wrapper").appendChild(renderer.domElement)
  controls = new THREE.OrbitControls(camera, renderer.domElement)
  controls.screenSpacePanning = false
  controls.listenToKeyEvents(window)
  controls.zoomSpeed = 0.5
  camera.position.set(0, 0, 200)
  controls.update()
  window.controls = controls
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}


setupThree()
animate()

document.querySelector(".file-input").addEventListener(
  "change",
  async function () {
    const reader = new FileReader()

    reader.onload = function (event) {
      const structOfArrays = true
      const file = new Uint8Array(event.target.result)
      const fileBytesLength = file.length

      let estimatedMs =
        ((structOfArrays ? 10000 : 20000) / 300_000_000) * fileBytesLength

      setProgressBar({ time: estimatedMs, value: 100 })

      console.log(
        `Starting parsing, estimated duration ${msToSeconds(
          estimatedMs,
          1
        )} seconds`
      )
      demoparserWorker.postMessage({
        cmd: "parseTicks",
        file,
        structOfArrays,
        wantedPropsOrEventNames: ["X", "Y", "Z"],
      })

      demoparserWorker.onmessage = function (e) {
        if (e.data.type === "result") {
          const { result, duration } = e.data
          setProgressBar({ time: 0, value: 100 })
          console.log(`Parsing finished in ${msToSeconds(duration, 1)} seconds`)
          plotPositions(result, "three-canvas")
        }
      }
    }

    reader.readAsArrayBuffer(this.files[0])
  },
  false
)

function plotPositions(dataMap, canvasId) {
  const X = dataMap.get("X")
  const Y = dataMap.get("Y")
  const Z = dataMap.get("Z")

  const { minX, maxX, minY, maxY, minZ, maxZ } = findMinMax(dataMap)

  // Calculate center by averaging the min and max
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const centerZ = (minZ + maxZ) / 2

  // Find the largest range to scale everything down proportionally
  const maxRange = Math.max(maxX - minX, maxY - minY, maxZ - minZ)

  const geometry = new THREE.BufferGeometry()

  const vertices = []
  for (let i = 0; i < X.length; i++) {
    // Normalize each coordinate: center and scale
    const x = ((X[i] - centerX) / maxRange) * 100
    const y = ((Y[i] - centerY) / maxRange) * 100
    const z = ((Z[i] - centerZ) / maxRange) * 100
    vertices.push(x, y, z)
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  )

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    // sizeAttenuation: false,
    transparent: true,
    opacity: 0.5,
  })

  const points = new THREE.Points(geometry, material)

  scene.add(points)
}

function findMinMax(dataMap) {
  const X = dataMap.get("X")
  const Y = dataMap.get("Y")
  const Z = dataMap.get("Z")

  let minX = Infinity,
    maxX = -Infinity
  let minY = Infinity,
    maxY = -Infinity
  let minZ = Infinity,
    maxZ = -Infinity

  for (let i = 0; i < X.length; i++) {
    if (X[i] < minX) minX = X[i]
    if (X[i] > maxX) maxX = X[i]
    if (Y[i] < minY) minY = Y[i]
    if (Y[i] > maxY) maxY = Y[i]
    if (Z[i] < minZ) minZ = Z[i]
    if (Z[i] > maxZ) maxZ = Z[i]
  }

  return { minX, maxX, minY, maxY, minZ, maxZ }
}
