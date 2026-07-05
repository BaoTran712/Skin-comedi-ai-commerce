import fs from 'fs';
import path from 'path';

const baseDir = 'e:/CT550-lv/Testskin';

const replacements = [
    [/ProductService/g, 'ProductService'],
    [/getAllProducts/g, 'getAllProducts'],
    [/createProduct/g, 'createProduct'],
    [/getProduct/g, 'getProduct'],
    [/updateProduct/g, 'updateProduct'],
    [/deleteProduct/g, 'deleteProduct'],
    [/deleteAllProducts/g, 'deleteAllProducts'],
    [/bookRouter/g, 'productRouter'],
    [/orderRouter/g, 'orderRouter'],
    [/brandRouter/g, 'brandRouter'],
    [/bookService/g, 'productService'],
    [/orderService/g, 'orderService'],
    [/brandService/g, 'brandService'],
    [/Testskin/g, 'Testskin'],
    [/Testskin/g, 'Testskin'],
    [/ebookshelf/g, 'testskin'],
    [/brand/g, 'brand'],
    [/Publisher/g, 'Brand'],
    [/order/g, 'order'],
    [/Borrow/g, 'Order'],
    [/product_id/g, 'product_id'],
    [/brand_id/g, 'brand_id'],
    [/book/g, 'product'],
    [/Book/g, 'Product'],
    [/products/g, 'products'],
    [/Books/g, 'Products'],
    [/author/g, 'usage'],
    [/published_year/g, 'expiry_date'],
    [/order_date/g, 'order_date'],
    [/return_date/g, 'delivery_date'],
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                walk(fullPath);
            }
        } else {
            const ext = path.extname(fullPath);
            if (['.js', '.vue', '.json', '.html', '.css'].includes(ext)) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let changed = false;
                for (const [regex, replacement] of replacements) {
                    if (regex.test(content)) {
                        content = content.replace(regex, replacement);
                        changed = true;
                    }
                }
                if (changed) {
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`Updated: ${fullPath}`);
                }
            }
        }
    }
}

walk(baseDir);
console.log('Final refactor complete.');
