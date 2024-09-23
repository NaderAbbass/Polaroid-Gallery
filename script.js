// إنشاء زر إعادة التعيين
function createResetButton() {
  const resetButton = document.createElement('button');
  resetButton.id = 'resetButton';
  resetButton.innerHTML = '<span>Reset All</span>';
  
  // إضافة الأنماط للزر
  const buttonStyle = `
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    display: block;
    padding: 10px;
    background-color: #f6f6f6;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    border: 1px solid #6A6A6A;
    font-size: 0.7em;
    text-align: center;
    color: #333;
    text-decoration: none;
    transition: none;
    font-family: fantasy, "Lucida handwriting", "Snell Roundhand", "Helvetica Neue", Arial, Helvetica, sans-serif;
    font-weight: medium;
    cursor: pointer;
  `;
  
  resetButton.style.cssText = buttonStyle;

  // إضافة مستمعي الأحداث
  resetButton.addEventListener('mouseover', function() {
    this.style.borderColor = 'red';
    this.querySelector('span').style.color = 'red';
  });

  resetButton.addEventListener('mouseout', function() {
    this.style.borderColor = '#6A6A6A';
    this.querySelector('span').style.color = '#333';
  });

  // إضافة وظيفة الزر
  resetButton.addEventListener('click', resetAll);

  // إضافة الزر إلى الألبوم
  const photoAlbum = document.querySelector('.photo-album');
  if (photoAlbum) {
    photoAlbum.appendChild(resetButton);
  }
}

// دالة جديدة تجمع بين مسح قاعدة البيانات وإعادة تعيين الصور
function resetAll() {
  clearIndexedDB();
  resetImagesToOriginal();
}

// دالة جديدة لإعادة الصور إلى حالتها الأصلية
function resetImagesToOriginal() {
  const polaroids = document.querySelectorAll('.polaroid');
  polaroids.forEach(polaroid => {
    const img = polaroid.querySelector('img');
    const caption = polaroid.querySelector('.caption');
    
    // استعادة الصورة الأصلية من الـ src الأصلي
    const originalSrc = img.getAttribute('data-original-src') || img.getAttribute('src');
    img.src = originalSrc;
    
    // حذف النص من الكابشن
    caption.textContent = '';
  });
  console.log('تم إعادة تعيين جميع الصور إلى حالتها الأصلية');
}

// دالة لمسح قاعدة البيانات وإعادة تعيين الصور
function clearIndexedDB() {
  const transaction = db.transaction(["polaroids"], "readwrite");
  const objectStore = transaction.objectStore("polaroids");
  const request = objectStore.clear();

  request.onsuccess = () => {
    resetImagesToOriginal();
  };

  request.onerror = (event) => {
    console.error("حدث خطأ أثناء مسح قاعدة البيانات:", event.target.error);
  };
}

// فتح قاعدة البيانات
const dbName = 'PhotoGalleryDB';
const dbVersion = 1;
let db;

const request = indexedDB.open(dbName, dbVersion);

request.onerror = (event) => {
  console.error("Error opening database:", event.target.error);
};

request.onsuccess = (event) => {
  db = event.target.result;
  loadFromIndexedDB();
};

request.onupgradeneeded = (event) => {
  db = event.target.result;
  const objectStore = db.createObjectStore("polaroids", { keyPath: "id" });
  objectStore.createIndex("id", "id", { unique: true });
};

// تحميل البيانات من قاعدة البيانات
function loadFromIndexedDB() {
  const transaction = db.transaction(["polaroids"], "readonly");
  const objectStore = transaction.objectStore("polaroids");
  const request = objectStore.getAll();

  request.onsuccess = (event) => {
    const savedData = event.target.result;
    if (savedData) {
      savedData.forEach(item => {
        const polaroid = document.querySelector(`.${item.id}`);
        if (polaroid) {
          const img = polaroid.querySelector('img');
          const caption = polaroid.querySelector('.caption');
          img.src = item.src;
          caption.textContent = item.text;
        }
      });
    }
  };
}

// حفظ بيانات الصورة في قاعدة البيانات
function savePolaroidData(polaroid) {
  const transaction = db.transaction(["polaroids"], "readwrite");
  const objectStore = transaction.objectStore("polaroids");
  const polaroidData = {
    id: polaroid.classList[polaroid.classList.length - 1],
    src: polaroid.querySelector('img').src,
    text: polaroid.querySelector('.caption').textContent
  };
  objectStore.put(polaroidData);
}

// تعديل دالة updatePolaroid لحفظ الـ src الأصلي
function updatePolaroid(polaroid, newSrc) {
  const img = polaroid.querySelector('img');
  
  // حفظ الـ src الأصلي إذا لم يكن محفوظًا بالفعل
  if (!img.hasAttribute('data-original-src')) {
    img.setAttribute('data-original-src', img.getAttribute('src'));
  }
  
  img.src = newSrc;
  
  const caption = polaroid.querySelector('.caption');
  const newText = prompt('Enter new text:', caption.textContent.trim());
  if (newText !== null) {
    caption.textContent = newText;
  }

  savePolaroidData(polaroid);
}

// إضافة مستمعي الأحداث
document.addEventListener('DOMContentLoaded', () => {
  createResetButton();
  
  const photoAlbum = document.getElementById('photoAlbum');
  const fileInput = document.getElementById('fileInput');
  let currentPolaroid = null;

  photoAlbum.addEventListener('click', (event) => {
    event.preventDefault();
    if (event.target.tagName === 'IMG') {
      currentPolaroid = event.target.closest('.polaroid');
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && currentPolaroid) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updatePolaroid(currentPolaroid, e.target.result);
      };
      reader.readAsDataURL(file);
    }
  });
});
