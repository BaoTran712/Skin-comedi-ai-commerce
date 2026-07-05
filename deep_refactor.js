import fs from 'fs';
import path from 'path';

const baseDir = 'e:/CT550-lv/Testskin';

const replacements = [
    [/BookService/g, 'ProductService'],
    [/getAllBooks/g, 'getAllProducts'],
    [/createBook/g, 'createProduct'],
    [/getBook/g, 'getProduct'],
    [/updateBook/g, 'updateProduct'],
    [/deleteBook/g, 'deleteProduct'],
    [/deleteAllBooks/g, 'deleteAllProducts'],
    [/fetchBooks/g, 'fetchProducts'],
    [/fetchBook/g, 'fetchProduct'],
    [/goToAddBook/g, 'goToAddProduct'],
    [/handleDeleteAllBooks/g, 'handleDeleteAllProducts'],
    [/handleUpdateBook/g, 'handleUpdateProduct'],
    [/handleDeleteBook/g, 'handleDeleteProduct'],
    [/handleCreateBook/g, 'handleCreateProduct'],
    
    [/BorrowService/g, 'OrderService'],
    [/getAllBorrows/g, 'getAllOrders'],
    [/getBorrowById/g, 'getOrderById'],
    [/createBorrow/g, 'createOrder'],
    [/updateBorrow/g, 'updateOrder'],
    [/deleteBorrow/g, 'deleteOrder'],
    [/deleteAllBorrows/g, 'deleteAllOrders'],
    [/fetchBorrows/g, 'fetchOrders'],
    [/fetchBorrow/g, 'fetchOrder'],
    [/handleCreateBorrow/g, 'handleCreateOrder'],
    [/handleDeleteBorrow/g, 'handleDeleteOrder'],
    [/handleUpdateBorrow/g, 'handleUpdateOrder'],

    [/PublisherService/g, 'BrandService'],
    [/getAllPublishers/g, 'getAllBrands'],
    [/getPublisherById/g, 'getBrandById'],
    [/createPublisher/g, 'createBrand'],
    [/updatePublisher/g, 'updateBrand'],
    [/deletePublisher/g, 'deleteBrand'],
    [/deleteAllPublishers/g, 'deleteAllBrands'],
    [/fetchPublishers/g, 'fetchBrands'],
    [/fetchPublisher/g, 'fetchBrand'],

    [/BookCard/g, 'ProductCard'],
    [/BorrowCard/g, 'OrderCard'],
    [/PublisherCard/g, 'BrandCard'],

    [/BookList/g, 'ProductList'],
    [/BookAdd/g, 'ProductAdd'],
    [/BookEdit/g, 'ProductEdit'],
    [/BorrowAdd/g, 'OrderAdd'],
    [/BorrowEdit/g, 'OrderEdit'],
    [/BorrowPending/g, 'OrderPending'],
    [/BorrowCheck/g, 'OrderCheck'],
    [/PublisherList/g, 'BrandList'],
    [/PublisherAdd/g, 'BrandAdd'],
    [/PublisherEdit/g, 'BrandEdit'],

    [/\/books/g, '/products'],
    [/\/borrow/g, '/order'],
    [/\/publisher/g, '/brand'],
    [/mượn sách/gi, 'đơn hàng'],
    [/Sách/gi, 'Sản phẩm'],
    [/Nhà xuất bản/gi, 'Thương hiệu'],

    [/book_id/g, 'product_id'],
    [/publisher_id/g, 'brand_id'],
    [/borrow_id/g, 'order_id'],

    [/CTU Ebookshelf/g, 'Testskin'],
    [/Ebookshelf/g, 'Testskin'],
];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.gemini') {
                walk(fullPath);
            }
        } else {
            const ext = path.extname(fullPath);
            if (['.js', '.vue', '.json', '.html', '.css'].includes(ext)) {
                // Skip the script itself
                if (file === 'deep_refactor.js') continue;
                
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
console.log('Deep refactor complete.');
