function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateKizCodeSting(){
  // Код формируется по принципу: 010 + barcode + 21 + 6 любых символов + 93 + 4 любых символа 
  // Пример 0104607060382105215Rm3g!93Zjt3, где barcode = 4607060382105
  const barcode = document.getElementById("barcode").value;
  
  const part1 = "010";
  const part2 = barcode;
  const part3 = "21";
  const part4 = generateRandomString(6);
  const part5 = "93";
  const part6 = generateRandomString(4);
  
  const result = part1 + part2 + part3 + part4 + part5 + part6;
  
  console.log(result);
  
  document.getElementById("kizString").textContent = result;
}

let IMAGES_COUNT = 0;

function drawCode(barcodeType){
  const kizString = document.getElementById("kizString").textContent;
  const barcodeString = document.getElementById("barcode").value;
  const codeText = barcodeType === 'datamatrix' ? kizString : barcodeString;
  
  let canvas = document.createElement('canvas');
  const options = {
            bcid:        barcodeType,       // Barcode type
            text:        codeText,       // Text to encode
            scale:       2,               // 3x scaling factor
            height:      10,              // Bar height, in millimeters
            includetext: true,            // Show human-readable text
            textxalign:  'center',        // Always good to set this
  };
  
  try {
      bwipjs.toCanvas(canvas, options);
      
      // Добавляем тег img. Тег добавляется в начало списка
      const generatedResultElement = document.getElementById("generatedResults");
      const imgElement = document.createElement("img");
      const divElement = document.createElement("div");
      const hrElement = document.createElement("hr");
      const imgElementId = 'img_' + IMAGES_COUNT.toString();
      imgElement.id = imgElementId;
      
      const nameElement = document.createElement('p');
      nameElement.textContent = codeText;
      // const textNode = document.createTextNode("\n"+codeText);
      divElement.appendChild(imgElement);
      divElement.appendChild(nameElement);
      divElement.appendChild(hrElement);
    
      generatedResultElement.insertBefore(divElement, generatedResultElement.children[0]);
      IMAGES_COUNT++;
      
      // Отображаем код в созданном теге
      document.getElementById(imgElementId).src = canvas.toDataURL('image/png');
  } catch (e) {
      console.log(e);
  }
}
