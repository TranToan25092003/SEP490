const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const TEST_FILES_DIR = __dirname;

// URLs for downloading real test images
const IMAGE_URLS = {
  'valid-image.jpg': 'https://picsum.photos/200/200.jpg',
  'test_image.jpg': 'https://picsum.photos/150/150.jpg',
  'test_image.jpeg': 'https://picsum.photos/180/180.jpg',
  'test_image.png': 'https://picsum.photos/200/200.png',
  'test_image.gif': 'https://media.giphy.com/media/3o7aCTfyhYawMw5I3K/giphy.gif',
  'test_image.webp': 'https://www.gstatic.com/webp/gallery/1.webp',
  'valid_image.jpg': 'https://picsum.photos/250/250.jpg',
  'valid_image.png': 'https://picsum.photos/220/220.png',
  'valid_image.gif': 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'valid_image.webp': 'https://www.gstatic.com/webp/gallery/2.webp',
  'small_file.jpg': 'https://picsum.photos/50/50.jpg',
  'max_size_file.jpg': 'https://picsum.photos/400/400.jpg',
  'my image file.jpg': 'https://picsum.photos/100/100.jpg',
};

// Vietnamese filename
const VIETNAMESE_FILENAME = 'hình_ảnh_xe.jpg';

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(TEST_FILES_DIR, filename);
    const file = fs.createWriteStream(filePath);

    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`  Redirecting to: ${redirectUrl}`);
        downloadFile(redirectUrl, filename).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${filename}`);
        resolve(filePath);
      });
    });

    request.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

function createMinimalPDF() {
  // Minimal valid PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF`;
  return Buffer.from(pdfContent);
}

function createEmptyFile() {
  return Buffer.alloc(0);
}

function createCorruptedJPEG() {
  // Random bytes that look like JPEG header but are corrupted
  return Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
                      0x49, 0x46, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
                      0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
}

function createLargeFile(sizeMB) {
  // Create a buffer of specified size in MB
  const sizeBytes = sizeMB * 1024 * 1024;
  const buffer = Buffer.alloc(sizeBytes);
  // Add JPEG header to make it look like an image
  buffer[0] = 0xFF;
  buffer[1] = 0xD8;
  buffer[2] = 0xFF;
  buffer[3] = 0xE0;
  return buffer;
}

function createTinyFile() {
  // Very small file (just a few bytes)
  return Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]);
}

async function generateTestFiles() {
  console.log('Generating test files for e2e testing...\n');

  // 1. Download real images from the internet
  console.log('📥 Downloading images from the internet...');
  for (const [filename, url] of Object.entries(IMAGE_URLS)) {
    try {
      await downloadFile(url, filename);
    } catch (error) {
      console.log(`✗ Failed to download ${filename}: ${error.message}`);
    }
  }

  // Download Vietnamese filename image
  try {
    await downloadFile('https://picsum.photos/120/120.jpg', VIETNAMESE_FILENAME);
  } catch (error) {
    console.log(`✗ Failed to download ${VIETNAMESE_FILENAME}: ${error.message}`);
  }

  console.log('\n📄 Creating PDF files...');
  // 2. Create PDF files
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'test_document.pdf'), createMinimalPDF());
  console.log('✓ Created: test_document.pdf');

  fs.writeFileSync(path.join(TEST_FILES_DIR, 'valid_document.pdf'), createMinimalPDF());
  console.log('✓ Created: valid_document.pdf');

  console.log('\n⚠️ Creating negative test files...');

  // 3. Create empty file
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'empty.jpg'), createEmptyFile());
  console.log('✓ Created: empty.jpg (empty file)');

  // 4. Create corrupted file
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'corrupted.jpg'), createCorruptedJPEG());
  console.log('✓ Created: corrupted.jpg (corrupted file)');

  // 5. Create tiny file
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'tiny_file.jpg'), createTinyFile());
  console.log('✓ Created: tiny_file.jpg (very small file)');

  // 6. Create large files for size limit testing
  console.log('\n📦 Creating large files for size limit testing...');
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'large_file_10mb.jpg'), createLargeFile(10));
  console.log('✓ Created: large_file_10mb.jpg (10MB file)');

  fs.writeFileSync(path.join(TEST_FILES_DIR, 'large_file_5mb.jpg'), createLargeFile(5));
  console.log('✓ Created: large_file_5mb.jpg (5MB file)');

  fs.writeFileSync(path.join(TEST_FILES_DIR, 'large_file_2mb.jpg'), createLargeFile(2));
  console.log('✓ Created: large_file_2mb.jpg (2MB file)');

  // 7. Create files with problematic names
  console.log('\n🔧 Creating files with special names...');

  // Executable extension (for invalid file type testing)
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'test.exe'), Buffer.from('MZ'));
  console.log('✓ Created: test.exe (executable file)');

  // Text file
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'document.txt'), Buffer.from('This is a text file.'));
  console.log('✓ Created: document.txt (text file)');

  // Hidden extension file
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'image.jpg.exe'), Buffer.from('MZ'));
  console.log('✓ Created: image.jpg.exe (hidden extension)');

  // File with special characters in name (safe version)
  fs.writeFileSync(path.join(TEST_FILES_DIR, 'file_script.jpg'), createTinyFile());
  console.log('✓ Created: file_script.jpg (special chars placeholder)');

  // Very long filename
  const longName = 'a'.repeat(200) + '.jpg';
  try {
    fs.writeFileSync(path.join(TEST_FILES_DIR, longName), createTinyFile());
    console.log(`✓ Created: ${longName.substring(0, 30)}... (very long filename)`);
  } catch (error) {
    console.log(`✗ Could not create very long filename: ${error.message}`);
  }

  console.log('\n✅ Test file generation complete!');
  console.log(`\nFiles created in: ${TEST_FILES_DIR}`);

  // List all files
  console.log('\n📁 Files in test-files directory:');
  const files = fs.readdirSync(TEST_FILES_DIR);
  files.forEach(file => {
    if (file !== 'generate-test-files.js') {
      const stats = fs.statSync(path.join(TEST_FILES_DIR, file));
      const size = stats.size < 1024 ? `${stats.size}B` :
                   stats.size < 1024 * 1024 ? `${(stats.size / 1024).toFixed(1)}KB` :
                   `${(stats.size / 1024 / 1024).toFixed(1)}MB`;
      console.log(`  - ${file} (${size})`);
    }
  });
}

generateTestFiles().catch(console.error);
