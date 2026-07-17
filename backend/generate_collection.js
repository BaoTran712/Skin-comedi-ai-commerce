import fs from 'fs';

const BASE_URL = "http://localhost:3000/api";

const collections = [
  { name: "Staff", path: "staff", crud: true },
  { name: "User", path: "user", crud: true },
  { name: "Brand", path: "brand", crud: true },
  { name: "Product", path: "product", crud: true },
  { name: "Order", path: "order", crud: true },
  { name: "Review", path: "review", crud: true },
  { name: "Diagnosis", path: "diagnosis", crud: true },
  { name: "Chat", path: "chat", crud: true },
  { name: "Auth", path: "auth", custom: ["POST /login", "POST /register", "POST /admin/login", "GET /google", "GET /facebook"] },
  { name: "Payment", path: "payment", custom: ["POST /create_payment_url", "GET /vnpay_return", "GET /vnpay_ipn"] },
  { name: "Post", path: "post", crud: true },
  { name: "Supplier", path: "supplier", crud: true },
  { name: "Import Receipt", path: "import-receipt", crud: true },
  { name: "Promotion", path: "promotion", crud: true },
  { name: "Setting", path: "setting", crud: true },
  { name: "Admin", path: "admin", custom: ["GET /stats/dashboard", "GET /stats/revenue", "GET /stats/orders"] },
  { name: "Admin Revenue", path: "admin/revenue", custom: ["GET /daily", "GET /monthly", "GET /yearly"] }
];

const postmanCollection = {
    info: {
        name: "Testskin API Postman Collection",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: []
};

collections.forEach(group => {
    let folder = {
        name: group.name,
        item: []
    };

    if (group.crud) {
        folder.item.push({
            name: `Get all ${group.name}`,
            request: { method: "GET", url: { raw: `${BASE_URL}/${group.path}`, host: ["http://localhost:3000"], path: ["api", ...group.path.split("/")] } }
        });
        folder.item.push({
            name: `Create ${group.name}`,
            request: { method: "POST", header: [{ key: "Content-Type", value: "application/json" }], body: { mode: "raw", raw: "{}" }, url: { raw: `${BASE_URL}/${group.path}`, host: ["http://localhost:3000"], path: ["api", ...group.path.split("/")] } }
        });
        folder.item.push({
            name: `Get ${group.name} by ID`,
            request: { method: "GET", url: { raw: `${BASE_URL}/${group.path}/123`, host: ["http://localhost:3000"], path: ["api", ...group.path.split("/"), "123"] } }
        });
        folder.item.push({
            name: `Update ${group.name}`,
            request: { method: "PUT", header: [{ key: "Content-Type", value: "application/json" }], body: { mode: "raw", raw: "{}" }, url: { raw: `${BASE_URL}/${group.path}/123`, host: ["http://localhost:3000"], path: ["api", ...group.path.split("/"), "123"] } }
        });
        folder.item.push({
            name: `Delete ${group.name}`,
            request: { method: "DELETE", url: { raw: `${BASE_URL}/${group.path}/123`, host: ["http://localhost:3000"], path: ["api", ...group.path.split("/"), "123"] } }
        });
    }

    if (group.custom) {
        group.custom.forEach(endpoint => {
            const [method, routePath] = endpoint.split(" ");
            const fullPath = routePath.replace(/^\//, '');
            folder.item.push({
                name: `${method} ${routePath}`,
                request: { 
                    method: method, 
                    url: { raw: `${BASE_URL}/${group.path}/${fullPath}`, host: ["http://localhost:3000"], path: ["api", ...group.path.split("/"), ...fullPath.split("/").filter(p => p)] },
                    ...(method === 'POST' || method === 'PUT' ? { header: [{ key: "Content-Type", value: "application/json" }], body: { mode: "raw", raw: "{}" } } : {})
                }
            });
        });
    }

    postmanCollection.item.push(folder);
});

fs.writeFileSync('../Testskin_API_Collection.json', JSON.stringify(postmanCollection, null, 4));
console.log('Postman collection generated at ../Testskin_API_Collection.json');
