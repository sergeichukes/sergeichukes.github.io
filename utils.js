function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateKizCodeSting() {
  const barcode = document.getElementById("barcode").value;
  
  const part1 = "010";
  const part2 = barcode;
  const part3 = "21";
  const part4 = generateRandomString(6);
  const part5 = "93";
  const part6 = generateRandomString(4);
  
  const result = part1 + part2 + part3 + part4 + part5 + part6;
  
  document.getElementById("kizString").textContent = result;
  return result;
}

function generateCode(barcodeType, text) {
  return new Promise((resolve, reject) => {
    let canvas = document.createElement('canvas');
    const options = {
      bcid: barcodeType,
      text: text,
      scale: 2,
      height: 10,
      includetext: true,
      textxalign: 'center',
    };
    
    try {
      bwipjs.toCanvas(canvas, options);
      resolve(canvas.toDataURL('image/png'));
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}

async function generateAndDrawCodes() {
  const barcodeValue = document.getElementById("barcode").value;
  if (!barcodeValue) {
    alert('Пожалуйста, введите штрих-код');
    return;
  }

  const kizValue = generateKizCodeSting();
  
  try {
    // Генерируем оба кода
    const dataMatrixUrl = await generateCode('datamatrix', kizValue);
    const barcodeUrl = await generateCode('code128', barcodeValue);
    
    // Создаем новую строку таблицы
    const tbody = document.getElementById("generatedResults");
    const row = document.createElement("tr");
    
    // Добавляем ячейку с Data Matrix
    const dataMatrixCell = document.createElement("td");
    const dataMatrixImg = document.createElement("img");
    dataMatrixImg.src = dataMatrixUrl;
    dataMatrixCell.appendChild(dataMatrixImg);
    
    // Добавляем ячейку со штрих-кодом
    const barcodeCell = document.createElement("td");
    const barcodeImg = document.createElement("img");
    barcodeImg.src = barcodeUrl;
    barcodeCell.appendChild(barcodeImg);
    
    // Добавляем ячейку с данными
    const dataCell = document.createElement("td");
    const dataDiv = document.createElement("div");
    dataDiv.className = "code-data";
    
    // Добавляем штрих-код
    const barcodeData = document.createElement("div");
    barcodeData.innerHTML = `
      <div class="text-label">Штрих-код:</div>
      <div class="barcode-text">${barcodeValue}</div>
    `;
    
    // Добавляем KIZ
    const kizData = document.createElement("div");
    kizData.innerHTML = `
      <div class="text-label">KIZ:</div>
      <div class="kiz-text">${kizValue}</div>
    `;
    
    dataDiv.appendChild(barcodeData);
    dataDiv.appendChild(kizData);
    dataCell.appendChild(dataDiv);
    
    // Добавляем все ячейки в строку
    row.appendChild(dataMatrixCell);
    row.appendChild(barcodeCell);
    row.appendChild(dataCell);
    
    // Добавляем строку в начало таблицы
    if (tbody.firstChild) {
      tbody.insertBefore(row, tbody.firstChild);
    } else {
      tbody.appendChild(row);
    }
    
  } catch (e) {
    console.error('Ошибка при генерации кодов:', e);
    alert('Произошла ошибка при генерации кодов');
  }
}

let IMAGES_COUNT = 0;

function drawCode(barcodeType) {
    const kizString = document.getElementById("kizString").textContent;
    const barcodeString = document.getElementById("barcode").value;
    const codeText = barcodeType === 'datamatrix' ? kizString : barcodeString;
    
    let canvas = document.createElement('canvas');
    const options = {
        bcid: barcodeType,
        text: codeText,
        scale: 2,
        height: 10,
        includetext: true,
        textxalign: 'center',
    };
    
    try {
        bwipjs.toCanvas(canvas, options);
        
        // Создаем новую строку таблицы
        const tbody = document.getElementById("generatedResults");
        const row = document.createElement("tr");
        
        // Добавляем ячейку с изображением
        const imgCell = document.createElement("td");
        const img = document.createElement("img");
        img.src = canvas.toDataURL('image/png');
        imgCell.appendChild(img);
        
        // Добавляем ячейку с текстом
        const textCell = document.createElement("td");
        const text = document.createElement("div");
        text.className = "code-text";
        text.textContent = codeText;
        textCell.appendChild(text);
        
        // Добавляем ячейки в строку
        row.appendChild(imgCell);
        row.appendChild(textCell);
        
        // Добавляем строку в начало таблицы
        if (tbody.firstChild) {
            tbody.insertBefore(row, tbody.firstChild);
        } else {
            tbody.appendChild(row);
        }
        
    } catch (e) {
        console.log(e);
    }
}

// Добавляем новую функцию для отрисовки штрих-кода как QR
async function drawBarcodeAsQR() {
    const barcodeValue = document.getElementById("barcode").value;
    if (!barcodeValue) {
        alert('Пожалуйста, введите штрих-код');
        return;
    }

    try {
        // Генерируем QR код из штрих-кода
        const qrUrl = await generateCode('datamatrix', barcodeValue);
        
        // Создаем новую строку таблицы
        const tbody = document.getElementById("generatedResults");
        const row = document.createElement("tr");
        
        // Добавляем ячейку с QR кодом
        const qrCell = document.createElement("td");
        const qrImg = document.createElement("img");
        qrImg.src = qrUrl;
        qrCell.appendChild(qrImg);
        
        // Пустая ячейка для штрих-кода
        const emptyCell = document.createElement("td");
        emptyCell.textContent = '—';
        
        // Добавляем ячейку с данными
        const dataCell = document.createElement("td");
        const dataDiv = document.createElement("div");
        dataDiv.className = "code-data";
        
        // Добавляем информацию о штрих-коде
        const barcodeData = document.createElement("div");
        barcodeData.innerHTML = `
            <div class="text-label">Штрих-код в QR:</div>
            <div class="barcode-text">${barcodeValue}</div>
        `;
        
        dataDiv.appendChild(barcodeData);
        dataCell.appendChild(dataDiv);
        
        // Добавляем все ячейки в строку
        row.appendChild(qrCell);
        row.appendChild(emptyCell);
        row.appendChild(dataCell);
        
        // Добавляем строку в начало таблицы
        if (tbody.firstChild) {
            tbody.insertBefore(row, tbody.firstChild);
        } else {
            tbody.appendChild(row);
        }
        
    } catch (e) {
        console.error('Ошибка при генерации QR кода:', e);
        alert('Произошла ошибка при генерации QR кода');
    }
}
