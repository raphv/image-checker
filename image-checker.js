const dropzone = document.getElementById('imagecheck-dropzone');
const previewimg = document.getElementById('imagecheck-preview');
const inputbtn = document.getElementById('imagecheck-input');
const ratiogroup = document.getElementById('ratio_group');
const imagesizerect = document.getElementById('image_dimensions_rect');
const statusline = document.getElementById('imagecheck-status');
const reader = new FileReader();
const defaultimage = previewimg.src;
        
function gcd (a, b) {
   return (b == 0) ? a : gcd (b, a%b);
}

function encodeSVG(svgdata) {
  svgdata = svgdata.replace(/'/g, `"`);
  svgdata = svgdata.replace(/>\s{1,}</g, `><`);
  svgdata = svgdata.replace(/\s{2,}</g, ` `);
  svgdata = svgdata.replace(/[\r\n%#()<>?[\\\]^`{|}]/g, encodeURIComponent);
  return `data:image/svg+xml,${svgdata}`;
}

function showStatus(statusclass, statustext) {
  statusline.className = statusclass;
  statusline.textContent = statustext; 
}

function hideImageSize() {
  ratiogroup.setAttribute('visibility','hidden');
  imagesizerect.setAttribute('visibility','hidden');
}

function displayImageSize() {
  let width = previewimg.naturalWidth,
    height = previewimg.naturalHeight;
  if (width) {
    let whgcd = gcd(width, height),
      aspectratio = width/height,
      aspectratiotext = 'N/A',
      ww = width/whgcd, hh = height/whgcd;
    if (ww > 25) {
      if (width > height) {
        aspectratiotext = `${aspectratio.toFixed(3)}:1`;
      } else {
        aspectratiotext = `1:${(1/aspectratio).toFixed(3)}`;
      }
    } else {
      aspectratiotext = `${ww}:${hh}`
    }
    document.getElementById('ratio_text').textContent = aspectratiotext;
    let frameheight = (aspectratio > 1) ? 80/aspectratio : 80,
      framewidth = (aspectratio < 1) ? 80*aspectratio : 80;
    let ratiorect = document.getElementById('ratio_rectangle');
    ratiorect.setAttribute('x',-framewidth/2);
    ratiorect.setAttribute('y',140-frameheight/2);
    ratiorect.setAttribute('width',framewidth);
    ratiorect.setAttribute('height',frameheight);
    let xpos = Math.min(560,Math.max(40, 300*(1+Math.log(aspectratio))));
    ratiogroup.setAttribute('transform',`translate(${xpos},0)`);
    ratiogroup.setAttribute('visibility','visible');
    imagesizerect.setAttribute('x',-width/2);
    imagesizerect.setAttribute('y',-height/2);
    imagesizerect.setAttribute('width',width);
    imagesizerect.setAttribute('height',height);
    imagesizerect.setAttribute('visibility','visible');
  } else {
    hideImageSize();
  }
  document.getElementById('image_width').textContent = width;
  document.getElementById('image_height').textContent = height;
  statusline.className = "success";
}

function bytesToText(bytes) {
  const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
  let exp = Math.floor(Math.log(bytes)/Math.log(1024)),
    val = bytes/Math.pow(1024, exp);
  return `${val.toFixed(+(val<20))}${suffixes[exp]}`;
}

function secToText(seconds) {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} milliseconds`;
  }
  let mins = Math.floor(seconds/60),
      secs = Math.floor(seconds) % 60,
      parts = [];
  if (mins > 1) parts.push(`${mins} minutes`);
  if (mins == 1) parts.push(`1 minute`);
  if (mins < 4) {
    if (secs > 1) parts.push(`${secs} seconds`);
    if (secs == 1) parts.push(`${seconds.toFixed(1)} second`);
  }
  return parts.join(" ");
}

function secToClass(seconds) {
  if (seconds > 2) return "error";
  if (seconds > .3) return "waiting";
  return "success";
}

function showFileDetails(filesize, mimetype) {
  let formatparts = mimetype.split(/[\/\+]/),
    formatname = formatparts[1];
  document.getElementById('imagecheck-filesize').textContent = bytesToText(filesize);
  document.getElementById('imagecheck-format').textContent = formatname;
  document.getElementById('imagecheck-filesize-table').style.display = 'table';
  document.getElementById('imagecheck-time-56k').textContent = secToText(filesize*8/56e3);
  document.getElementById('imagecheck-time-3g').textContent = secToText(filesize*8/7e6);
  document.getElementById('imagecheck-time-4g').textContent = secToText(filesize*8/50e6);
  document.getElementById('imagecheck-time-56k').className = secToClass(filesize*8/56e3);
  document.getElementById('imagecheck-time-3g').className = secToClass(filesize*8/7e6);
  document.getElementById('imagecheck-time-4g').className = secToClass(filesize*8/50e6);
  document.getElementById('imagecheck-nb-fl').textContent = (Math.floor(1.44e6/filesize) || "can't fit");
  document.getElementById('imagecheck-nb-cd').textContent = Math.floor(650e6/filesize);
  document.getElementById('imagecheck-nb-gd').textContent = Math.floor(15e9/filesize);
  document.getElementById('imagecheck-format-features').className = formatname;
  document.getElementById('filesize-marker').setAttribute('visibility', 'visible');
  document.getElementById('filesize-marker').setAttribute('transform', `translate(${Math.log(filesize)*150/Math.log(1024)-75},0)`);
}

function hideFileDetails() {
  document.getElementById('imagecheck-filesize').textContent = "unknown";
  document.getElementById('imagecheck-format').textContent = "unknown";
  document.getElementById('imagecheck-filesize-table').style.display = 'none';
  document.getElementById('imagecheck-format-features').className = '';
  document.getElementById('filesize-marker').setAttribute('visibility', 'hidden');
}

function openFile(file) {
    /* This is the callback triggered when opening a file,
     * either from drag-and-drop or browsing file */
    if (!file) {
        showStatus("error","No file opened or dropped");
        return;
    }
    let ftypeparts = file.type.split("/");
    if (ftypeparts[0] !== "image") {
        /* If the file is not an image, we discard it */
        showStatus("error","File is not an image");
        return;
    }
    showFileDetails(file.size, file.type);
    showStatus("waiting", `Checking "${file.name}"`);
    reader.readAsDataURL(file);
}

reader.addEventListener('load', function() {
  ratiogroup.setAttribute('visibility','hidden');
	previewimg.src = reader.result;
});

previewimg.addEventListener('load', function() {
  if (previewimg.src !== defaultimage) {
    displayImageSize();
  }
});

dropzone.addEventListener('dragenter', function(event) {
  event.preventDefault();
  event.dataTransfer.effectAllowed = 'copy';
});
dropzone.addEventListener('dragover', function(event) {
  event.preventDefault();
});
dropzone.addEventListener('dragleave', function(event) {
  event.preventDefault();
});
dropzone.addEventListener('drop', function(event) {
  event.preventDefault();
  if (event.dataTransfer.files.length) {
     /* Is there a file that has been dropped?
      * If yes, try to read it */
     openFile(event.dataTransfer.files[0]);
     return;
  }
  let htmldata = event.dataTransfer.getData("text/html");
  /* For debugging purposes
  event.dataTransfer.types.forEach(function(t) {
     console.log(t);
     console.log(event.dataTransfer.getData(t));
  });
  */
  if (htmldata) {
    /* Is there a HTML snippet being dropped?
     * If yes, let's try to find an <img> tag inside */
    let htmltree = document.createElement('div');
    htmltree.innerHTML = htmldata;
    let imgel = htmltree.querySelector('img');
    if (imgel) {
      let previewurl = imgel.src;
      hideImageSize();
      hideFileDetails();
      if (previewurl.substr(0,4) === "data") {
        dataparts = previewurl.split(/[:;,]/);
        if (dataparts[2] === "base64") {
          showFileDetails(Math.floor(.75*dataparts[3].length), dataparts[1]);
        }
      }
      if (previewurl.length > 50) {
        previewurl = `${previewurl.substr(0,20)}…${previewurl.substr(-20,20)}`
      }
      showStatus("waiting", `Checking "${previewurl}"`);
      previewimg.src = imgel.src;
      return;
    }
    let svgel = htmltree.querySelector('svg');
    if (svgel) {
        let svgw = svgel.getAttribute('width'), svgh = svgel.getAttribute('height');
        if (!(svgw && svgh)) {
          let svgvb = svgel.getAttribute('viewBox');
          if (svgvb) {
            let vbitems = svgvb.split(" ");
            if (vbitems.length >= 4) {
              svgel.setAttribute('width', vbitems[2]);
              svgel.setAttribute('height', vbitems[3]);
            }
          }
        }
        svgel.setAttribute('xmlns','http://www.w3.org/2000/svg');
        svgel.removeAttribute('class');
        svgel.removeAttribute('style');
        let svgdata = svgel.outerHTML;
        hideImageSize();
        showFileDetails(svgdata.length, 'image/svg+xml');
        showStatus("waiting", `Checking inline SVG image (results may not be accurate)`);
        previewimg.src = encodeSVG(svgdata);
        return;
    }
  }
  showStatus("error", "What you've dropped isn't an image.");
});
inputbtn.addEventListener('change', function(event) {
   event.preventDefault();
   openFile(inputbtn.files[0]);
});