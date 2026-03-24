import json
from datetime import datetime
from urllib.parse import parse_qs

from workers import WorkerEntrypoint
import asgi


CORS_HEADERS = [
    (b"access-control-allow-origin", b"*"),
    (b"access-control-allow-methods", b"GET,POST,PUT,DELETE,OPTIONS"),
    (b"access-control-allow-headers", b"Content-Type,Authorization"),
]


def _headers(extra=None):
    headers = list(CORS_HEADERS)
    if extra:
        headers.extend(extra)
    return headers


async def _read_body(receive):
    body = b""
    while True:
        message = await receive()
        if message["type"] != "http.request":
            continue
        body += message.get("body", b"")
        if not message.get("more_body"):
            break
    return body


async def _send_json(send, status, payload):
    body = json.dumps(payload).encode("utf-8")
    await send(
        {
            "type": "http.response.start",
            "status": status,
            "headers": _headers([(b"content-type", b"application/json")]),
        }
    )
    await send({"type": "http.response.body", "body": body})


async def _send_empty(send, status):
    await send({"type": "http.response.start", "status": status, "headers": _headers()})
    await send({"type": "http.response.body", "body": b""})


def _get_env(scope):
    env = scope.get("env")
    if not env or not getattr(env, "DB", None):
        raise RuntimeError("Database binding not configured")
    return env


async def _query(env, sql, params=None):
    stmt = env.DB.prepare(sql)
    if params:
        stmt = stmt.bind(*params)
    result = await stmt.all()
    return result.results


async def _first(env, sql, params=None):
    rows = await _query(env, sql, params)
    return rows[0] if rows else None


async def _run(env, sql, params=None):
    stmt = env.DB.prepare(sql)
    if params:
        stmt = stmt.bind(*params)
    return await stmt.run()


async def app(scope, receive, send):
    if scope.get("type") != "http":
        return

    method = scope.get("method", "GET").upper()
    path = scope.get("path", "/")

    if method == "OPTIONS":
        await _send_empty(send, 204)
        return

    try:
        env = _get_env(scope)
    except RuntimeError as exc:
        await _send_json(send, 500, {"detail": str(exc)})
        return

    parts = [part for part in path.split("/") if part]
    if not parts:
        await _send_json(send, 200, {"message": "Educon POS API"})
        return

    try:
        if parts[0] == "books":
            if len(parts) == 1:
                if method == "GET":
                    query = parse_qs(scope.get("query_string", b"").decode())
                    skip = int(query.get("skip", ["0"])[0])
                    limit = int(query.get("limit", ["100"])[0])
                    rows = await _query(
                        env,
                        "SELECT id, title, author, isbn_barcode, price, stock FROM books LIMIT ? OFFSET ?",
                        [limit, skip],
                    )
                    await _send_json(send, 200, rows)
                    return
                if method == "POST":
                    payload = json.loads((await _read_body(receive)) or b"{}").copy()
                    price = float(payload.get("price", 0))
                    stock = int(payload.get("stock", 0))
                    if price < 0 or stock < 0:
                        await _send_json(send, 400, {"detail": "Invalid stock or price"})
                        return
                    book = await _first(
                        env,
                        """
                        INSERT INTO books (title, author, isbn_barcode, price, stock)
                        VALUES (?, ?, ?, ?, ?)
                        RETURNING id, title, author, isbn_barcode, price, stock
                        """,
                        [
                            payload.get("title"),
                            payload.get("author"),
                            payload.get("isbn_barcode"),
                            price,
                            stock,
                        ],
                    )
                    await _send_json(send, 201, book)
                    return
            if len(parts) == 2 and parts[1].isdigit():
                book_id = int(parts[1])
                if method == "GET":
                    book = await _first(
                        env,
                        "SELECT id, title, author, isbn_barcode, price, stock FROM books WHERE id = ?",
                        [book_id],
                    )
                    if not book:
                        await _send_json(send, 404, {"detail": "Book not found"})
                        return
                    await _send_json(send, 200, book)
                    return
                if method == "PUT":
                    current = await _first(
                        env,
                        "SELECT id, title, author, isbn_barcode, price, stock FROM books WHERE id = ?",
                        [book_id],
                    )
                    if not current:
                        await _send_json(send, 404, {"detail": "Book not found"})
                        return
                    payload = json.loads((await _read_body(receive)) or b"{}").copy()
                    new_values = {
                        "title": payload.get("title", current["title"]),
                        "author": payload.get("author", current["author"]),
                        "isbn_barcode": payload.get("isbn_barcode", current["isbn_barcode"]),
                        "price": payload.get("price", current["price"]),
                        "stock": payload.get("stock", current["stock"]),
                    }
                    if new_values["price"] is not None and new_values["price"] < 0:
                        await _send_json(send, 400, {"detail": "Invalid price"})
                        return
                    if new_values["stock"] is not None and new_values["stock"] < 0:
                        await _send_json(send, 400, {"detail": "Invalid stock"})
                        return
                    updated = await _first(
                        env,
                        """
                        UPDATE books
                        SET title = ?, author = ?, isbn_barcode = ?, price = ?, stock = ?
                        WHERE id = ?
                        RETURNING id, title, author, isbn_barcode, price, stock
                        """,
                        [
                            new_values["title"],
                            new_values["author"],
                            new_values["isbn_barcode"],
                            new_values["price"],
                            new_values["stock"],
                            book_id,
                        ],
                    )
                    await _send_json(send, 200, updated)
                    return
                if method == "DELETE":
                    existing = await _first(env, "SELECT id FROM books WHERE id = ?", [book_id])
                    if not existing:
                        await _send_json(send, 404, {"detail": "Book not found"})
                        return
                    await _run(env, "DELETE FROM books WHERE id = ?", [book_id])
                    await _send_empty(send, 204)
                    return

        if parts[0] == "students":
            if len(parts) == 1:
                if method == "GET":
                    query = parse_qs(scope.get("query_string", b"").decode())
                    skip = int(query.get("skip", ["0"])[0])
                    limit = int(query.get("limit", ["100"])[0])
                    rows = await _query(
                        env,
                        "SELECT id, name, phone, email FROM students LIMIT ? OFFSET ?",
                        [limit, skip],
                    )
                    await _send_json(send, 200, rows)
                    return
                if method == "POST":
                    payload = json.loads((await _read_body(receive)) or b"{}").copy()
                    student = await _first(
                        env,
                        """
                        INSERT INTO students (name, phone, email)
                        VALUES (?, ?, ?)
                        RETURNING id, name, phone, email
                        """,
                        [payload.get("name"), payload.get("phone"), payload.get("email")],
                    )
                    await _send_json(send, 201, student)
                    return
            if len(parts) == 2 and parts[1].isdigit():
                student_id = int(parts[1])
                if method == "GET":
                    student = await _first(
                        env,
                        "SELECT id, name, phone, email FROM students WHERE id = ?",
                        [student_id],
                    )
                    if not student:
                        await _send_json(send, 404, {"detail": "Student not found"})
                        return
                    await _send_json(send, 200, student)
                    return
                if method == "PUT":
                    current = await _first(
                        env,
                        "SELECT id, name, phone, email FROM students WHERE id = ?",
                        [student_id],
                    )
                    if not current:
                        await _send_json(send, 404, {"detail": "Student not found"})
                        return
                    payload = json.loads((await _read_body(receive)) or b"{}").copy()
                    new_values = {
                        "name": payload.get("name", current["name"]),
                        "phone": payload.get("phone", current["phone"]),
                        "email": payload.get("email", current["email"]),
                    }
                    updated = await _first(
                        env,
                        """
                        UPDATE students
                        SET name = ?, phone = ?, email = ?
                        WHERE id = ?
                        RETURNING id, name, phone, email
                        """,
                        [new_values["name"], new_values["phone"], new_values["email"], student_id],
                    )
                    await _send_json(send, 200, updated)
                    return
                if method == "DELETE":
                    existing = await _first(env, "SELECT id FROM students WHERE id = ?", [student_id])
                    if not existing:
                        await _send_json(send, 404, {"detail": "Student not found"})
                        return
                    await _run(env, "DELETE FROM students WHERE id = ?", [student_id])
                    await _send_empty(send, 204)
                    return

        if parts[0] == "transactions" and len(parts) == 1 and method == "POST":
            payload = json.loads((await _read_body(receive)) or b"{}").copy()
            discount = float(payload.get("discount", 0))
            if discount < 0:
                await _send_json(send, 400, {"detail": "Invalid discount"})
                return
            items = payload.get("items") or []
            if not items:
                await _send_json(send, 400, {"detail": "No items provided"})
                return
            student_id = payload.get("student_id")
            student = await _first(env, "SELECT id FROM students WHERE id = ?", [student_id])
            if not student:
                await _send_json(send, 404, {"detail": "Student not found"})
                return

            subtotal = 0.0
            items_to_insert = []

            for item in items:
                quantity = int(item.get("quantity", 0))
                if quantity <= 0:
                    await _send_json(send, 400, {"detail": "Invalid quantity"})
                    return
                book_id = item.get("book_id")
                book = await _first(
                    env,
                    "SELECT id, price, stock FROM books WHERE id = ?",
                    [book_id],
                )
                if not book:
                    await _send_json(send, 404, {"detail": f"Book {book_id} not found"})
                    return
                if book["stock"] < quantity:
                    await _send_json(send, 400, {"detail": f"Insufficient stock for book {book['id']}"})
                    return

                update_result = await _run(
                    env,
                    "UPDATE books SET stock = stock - ? WHERE id = ? AND stock >= ?",
                    [quantity, book_id, quantity],
                )
                changes = getattr(update_result, "meta", {}).get("changes") if hasattr(update_result, "meta") else None
                if changes == 0:
                    await _send_json(send, 400, {"detail": f"Insufficient stock for book {book_id}"})
                    return

                line_total = book["price"] * quantity
                subtotal += line_total
                items_to_insert.append(
                    {
                        "book_id": book_id,
                        "quantity": quantity,
                        "price_at_sale": book["price"],
                    }
                )

            total_amount = max(subtotal - discount, 0.0)
            created_at = datetime.utcnow().isoformat()

            transaction = await _first(
                env,
                """
                INSERT INTO transactions (student_id, total_amount, discount, date)
                VALUES (?, ?, ?, ?)
                RETURNING id, student_id, total_amount, discount, date
                """,
                [student_id, total_amount, discount, created_at],
            )

            for item in items_to_insert:
                await _run(
                    env,
                    """
                    INSERT INTO transaction_items (transaction_id, book_id, quantity, price_at_sale)
                    VALUES (?, ?, ?, ?)
                    """,
                    [transaction["id"], item["book_id"], item["quantity"], item["price_at_sale"]],
                )

            items = await _query(
                env,
                """
                SELECT id, book_id, quantity, price_at_sale
                FROM transaction_items
                WHERE transaction_id = ?
                """,
                [transaction["id"]],
            )
            transaction["items"] = items
            await _send_json(send, 201, transaction)
            return

        await _send_json(send, 404, {"detail": "Not found"})
    except Exception as exc:
        await _send_json(send, 500, {"detail": str(exc)})


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        return await asgi.fetch(app, request.js_object, self.env)
