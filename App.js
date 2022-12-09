'use strict';

const width = 500;
const w = 5, h = 5;
const size = width / w;
function mathmod(a, b) {
  return ((a % b) + b ) % b;
}

const e = React.createElement;

const Circle = ({cx, cy, r, color}) => {

  const className = 'circle';
  const style = {
    backgroundColor: color || '#000',
    width: `${2*r}px`,
    height: `${2*r}px`,
    position: 'absolute',
    left: `${cx - r}px`,
    top: `${cy - r}px`,
    zIndex: `100`,
  }
  
  return e(
    'div',
    { style, className },
  )
}

const Tile = ({size, x, y, ori, url, move, id}) => {

  const self = React.useRef(null);
  
  const style = {
    width: `${size}px`,
    height: `${size}px`,
    left: `${size*x}px`,
    top: `${size*y}px`,
    backgroundImage: `url(${url})`,
    transform: `rotateZ(${ori*90}deg translatex(${size*x}) translatey(${size*y})`,
  }

  const className = 'tile';

  React.useEffect(() => {
    if ( self.current && move) {
      console.log(`moving ${id}`);
      self.current.style.left = `${size * move.x}px`;
      self.current.style.top =  `${size * move.y}px`;
      self.current.style.transformOrigin = `${move.origin}`;
      self.current.style.transform = `rotateZ(${move.ori*90}deg translatex(${move.x * size}) translatey(${move.y * size})`;
      self.current.style.zIndex = `99`;

      setTimeout(() => {
        if (self.current) {
          self.current.style.zIndex = `1`;
          self.current.style.transformOrigin = `center`;
        }
      }, 0);
    }
  })

  const str = move ? move.ori : ori;
  
  return e(
    'div',
    { ref: self, style, className, id },
    str
  )
}

function randomColor() {
  return `rgb(${Math.random()*256}, ${Math.random()*256}, ${Math.random()*256})`
}

function TileData( ox, oy, x, y, ori, url, move) {
  return { ox, oy, x, y, ori, url, move };
}

function CircleData(cx, cy, r, color) {
  return { cx, cy, r, color };
}

function makeCircleData() {

  const width = 500;
  const circleData = [];
  for (let i = 1; i < h; i++) {
    for (let j = 1; j < w; j++) {
      const size = width / w;
      const cx = size * j;
      const cy = size * i;
      const radius = size * 0.1;
      const color = 'white';
  
      circleData.push(CircleData(
        cx, cy, radius, color
      ));
    }
  }
  
  return circleData;
}

function getComponentCoord(el, clientX, clientY) {
  const rect = el.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return { x , y }
}


const TileBoard = ({reset, setCorrect, imageName, imageSlices}) => {
  const boardRef = React.useRef(null);
  const [sel, setSel] = React.useState(null);
  const [tileData, setTileData] = React.useState([]);
  const circleData = makeCircleData();
  if (sel !== null) {
    circleData[sel].color = 'black';
  }
  function makeTileData() {
    const tileData = [];
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const y = i;
        const x = j;
        const url = imageSlices[j + i * w];
        const ori = 0;
        const move = null;
        tileData.push(TileData(
          x, y, x, y, ori, url, move)
        );
      }
    }
    return tileData;
  }
  function tileCorrectPosition() {
    for (let i = 0; i < tileData.length; i++) {
      const td = tileData[i];
      if (td.move) {
        if (td.move.x !== td.ox || td.move.y !== td.oy || mathmod(td.move.ori, 4) !== 0)
          return false;
      } else if (td.x !== td.ox || td.y !== td.oy || mathmod(td.ori, 4) !== 0) {
        return false;
      }
    }
    return true;
  }
  
  const className = 'tile-board';
  
  function findClosestCircle(x, y) {
    let sc = null
    let si = -1;
    let smallest = 9999999999;
    for (let i = 0; i < circleData.length; i++) {
      let cd = circleData[i];
      let dx = x - cd.cx;
      let dy = y - cd.cy;
      let d = dx * dx + dy * dy;
      if (d < smallest) {
        smallest = d;
        sc = cd;
        si = i;
      }
    }
    return si;
  }

  React.useEffect(() => {
    if (imageSlices) {
      setTileData(makeTileData());
    }
  }, [imageSlices])

  const onMouseMove = (e) => {

    if (!boardRef) return;
    const { clientX, clientY } = e;
    const { x, y } = getComponentCoord(boardRef.current, clientX, clientY);
    const closestIndex = findClosestCircle(x, y);
    if ( sel !== closestIndex) {
      clearMoves();
      setSel(closestIndex);
    }
  }

  function getTileDataIndexFromCirclePos(cx, cy) {
    
    const ind = [];
    ind.push({x: cx, y: cy});
    ind.push({x: cx+1, y: cy});
    ind.push({x: cx+1, y: cy+1});
    ind.push({x: cx, y: cy+1});
    return ind;
  }

  function getTileFromIndex(x, y) {
    for (let i = 0; i < tileData.length; i++) {
      const td = tileData[i];
      if (td.x === x && td.y === y) return td;
    }
    throw 'whoops';
  }

  function rotateTileData(indices) {
    const origins = [
      'bottom right',
      'bottom left',
      'top left',
      'top right',
    ];
    for (let i = 0; i < indices.length; i++) {
      const dx = (i == 0) ? 1 : (i == 2) ? -1 : 0;
      const dy = (i == 1) ? 1 : (i == 3) ? -1 : 0;
      const tile = getTileFromIndex(indices[i].x, indices[i].y);
      const move = {
        ori: tile.ori + 1,
        x:   tile.x + dx,
        y:   tile.y + dy,
        origin: origins[i],
      }

      tile.move = move;
    }
  }
  function clearMoves() {
    for (let i = 0; i < tileData.length; i++) {
      const td = tileData[i];
      if (td.move) {
        td.x = td.move.x;
        td.y = td.move.y;
        td.ori = td.move.ori;
      }
      td.move = null;
    }
  }

  const shuffle = (cx, cy) => {
    clearMoves();
    const tileDataIndices = getTileDataIndexFromCirclePos(cx, cy);
    rotateTileData(tileDataIndices);

    setTileData([...tileData]);
  }
  
  const onClick = () => {
    if (sel !== null) {
      const sely = Math.floor( sel / (w-1));
      const selx = sel % (w-1);
      shuffle(selx, sely);
    }
  }

  React.useEffect(() => {
    if (tileCorrectPosition()) {
      setCorrect(true);
    } else {
      setCorrect(false);
    }
  })

  const circles = circleData.map((c, i) => {
    return e(Circle, {...c, key:`c-${i}`});
  });
  const tiles = tileData.map((t, i) => {
      const { url, x, y, ori, move } = t;
      const name = `${imageName}-${i}`;
      return e(Tile, {x, y, ori, move, url, size, key: name, id: name })
  })
  return e(
    'div',
    { ref: boardRef, className, onMouseMove, onClick },
    e(
      'div',
      {},
      circles,
    ),
    e(
      'div',
      {},
      tiles,
    )
  )
}

async function ImageSlices(imageBlob) {
  const img = await createImageBitmap(imageBlob);
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const blobs = [];
  
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      const sx = img.width / w * j;
      const sy = img.height / h * i;
      const sWidth = img.width / w;
      const sHeight = img.height / h;
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size)
      blobs.push(new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob))
      }));
    }
  }
  const results = await Promise.all(blobs);
  const urls = [];
  for (let blob of results) {
    const url = URL.createObjectURL(blob);
    urls.push(url);
  }

  return urls
}



const ImageSelect = ({revokeURLs, setImageName, setImageSlices}) => {

  const [previewURL, setPreviewURL] = React.useState(null);
  const [fileBlob, setFileBlob] = React.useState(null);
  const inputRef = React.useRef();
  
  const onChange = async (e) => {
      const curFiles = e.target.files;
      if (curFiles.length > 0) {
        const blob = curFiles[0];
        setPreviewURL(URL.createObjectURL(blob))

        revokeURLs();
        setImageSlices(null);
        const urls = await ImageSlices(blob);
        setImageName(blob.name);
      
        setImageSlices(urls);
      }
  }
  
  const attr = {
    type: 'file',
    accept: "image/*",
    onChange,
    onClick: (e) => {e.target.value = null;},
    style: {
      display: 'none',
    },
    ref: inputRef,
  }

  const style = {
    display: 'flex'
  }
  const imgAttr = {
    src: previewURL,
    style: {
      width: `50px`,
      height: `50px`,
    }
  }
  return e(
    'div',
    { style },
    e('div', {},
      e('button', { onClick: () => {inputRef.current.click()} }, 'Choose Image'),
      e('input', attr,),
    ),
    e('img', imgAttr,),
  )
}

function randomImageSlices(setImageName, setImageSlices) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = width;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      ctx.fillStyle = randomColor();
      ctx.fillRect(j * size, i * size, size, size);
    }
  }
  canvas.toBlob(async (blob) => {
    const slices = await ImageSlices(blob);
    setImageName('default');
    setImageSlices(slices);
  }); 
}

const App = () => {
  const className = 'app';

  
  const [correct, setCorrect] = React.useState(true);

  const [imageName, setImageName] = React.useState(null);
  const [imageSlices, setImageSlices] = React.useState(null);

  const revokeURLs = () => {
    if (imageSlices) imageSlices.forEach(url => URL.revokeObjectURL(url));
  }

  React.useEffect(() => {
    randomImageSlices(setImageName, setImageSlices);
  }, [])

  const resetOnClick = () => {
    
  }
  
  const solved = correct ? 'correct' : 'wrong';
  const loaded = imageSlices ? 'loaded' : 'loading...';
  return e(
    'div',
    { className },
    e(TileBoard, { imageName, setCorrect, imageSlices}),
    e('div', {}, loaded),
    e('div', {}, solved),
    e('button', { onClick: resetOnClick }, 'reset'),
    e(ImageSelect, {revokeURLs, setImageName, setImageSlices}),
  )
}

const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(e(App));