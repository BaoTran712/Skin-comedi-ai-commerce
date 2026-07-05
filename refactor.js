const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(__dirname, 'frontend', 'src'),
    path.join(__dirname, 'backend', 'src'),
    path.join(__dirname, 'backend', 'app.js'),
    path.join(__dirname, 'backend', 'server.js'),
    path.join(__dirname, 'frontend', 'index.html'),
];

const replacements = [
    { regex: /products/g, replace: 'products' },
    { regex: /Books/g, replace: 'Products' },
    { regex: /book/g, replace: 'product' },
    { regex: /Book/g, replace: 'Product' },
    
    { regex: /brands/g, replace: 'brands' },
    { regex: /Publishers/g, replace: 'Brands' },
    { regex: /brand/g, replace: 'brand' },
    { regex: /Publisher/g, replace: 'Brand' },
    
    { regex: /orders/g, replace: 'orders' },
    { regex: /Borrows/g, replace: 'Orders' },
    { regex: /order/g, replace: 'order' },
    { regex: /Borrow/g, replace: 'Order' },
    
    { regex: /\bauthor\b/g, replace: 'usage' },
    { regex: /\bpublished_year\b/g, replace: 'expiry_date' },
    { regex: /ebookshelf/g, replace: 'testskin' },
    { regex: /Testskin/g, replace: 'Testskin' }
];

function processDirectory(dir) {
    if (!fs.existsSync(dir)) return;
    
    const stats = fs.statSync(dir);
    if (stats.isFile()) {
        processFile(dir);
        return;
    }

    const items = fs.readdirSync(dir);
    for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === 'assets') continue;
        
        let itemPath = path.join(dir, item);
        const itemStats = fs.statSync(itemPath);

        // Rename file/folder if necessary
        let newItem = item;
        newItem = newItem.replace(/Book/g, 'Product').replace(/book/g, 'product');
        newItem = newItem.replace(/Publisher/g, 'Brand').replace(/brand/g, 'brand');
        newItem = newItem.replace(/Borrow/g, 'Order').replace(/order/g, 'order');

        if (newItem !== item) {
            const newItemPath = path.join(dir, newItem);
            fs.renameSync(itemPath, newItemPath);
            itemPath = newItemPath;
        }

        if (itemStats.isDirectory()) {
            processDirectory(itemPath);
        } else {
            processFile(itemPath);
        }
    }
}

function processFile(filePath) {
    // Only process text files
    const ext = path.extname(filePath);
    if (!['.js', '.vue', '.html', '.json', '.css'].includes(ext) && ext !== '') return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    for (const rule of replacements) {
        content = content.replace(rule.regex, rule.replace);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated file: ${filePath}`);
    }
}

targetDirs.forEach(dir => processDirectory(dir));
console.log('Refactoring complete.');
