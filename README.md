npm install

npm start

AUTH - API

    - POST /api/auth/login
    - POST /api/auth/register
    - POST /api/auth/logout

MEMBER - API

    - POST /api/members

SYSTEM - API

    GetBookList
    - GET /api/system/books

    GetBookByID
    - GET /api/system/books/:id

    AddBook
    - POST /api/system/books

    UpdateBook
    - PUT /api/system/books/:id

    DeleteBook
    - DELETE /api/system/books/:id

BorrowBook

    For Borrow Book
    - POST /api/system/borrow

    For Return Book
    - POST /api/system/return


ENV REQUIRED

    - DB_HOST=localhost
    - DB_USER=string
    - DB_PASSWORD=string
    - DB_PORT=5432
    - DB_NAME=string
    - DB_DIALECT=postgres

    - JWT_SECRET=string
    - JWT_ACCESS_EXPIRES_IN=12h

    - CRYPTO_KEY= string

    - CORS_ORIGIN=http://localhost:3000
