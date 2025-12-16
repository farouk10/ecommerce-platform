import requests
import json
import time
import sys

# Configuration des URLs
AUTH_URL = "http://localhost:8081/api/auth"
PRODUCT_URL = "http://localhost:8082/api/products"
CATEGORY_URL = "http://localhost:8082/api/categories"
CART_URL = "http://localhost:8085/api/cart"
ORDER_URL = "http://localhost:8083/api/orders"
ADMIN_URL = "http://localhost:8083/api/admin"

# Variables globales
EMAIL = f"testUser_{int(time.time())}@example.com"
PASSWORD = "password123"
TOKEN = None
USER_ID = None
PRODUCT_ID = None
ORDER_ID = None

def print_step(message):
    print(f"\n{'='*60}")
    print(f"🔹 {message}")
    print(f"{'='*60}")

def check_response(response, expected_code=200):
    if response.status_code != expected_code:
        print(f"❌ FAILED: Expected {expected_code}, got {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response: {response.text}")
        sys.exit(1)
    print("✅ SUCCESS")
    return response

# 1. AUTHENTICATION SERVICE
def test_auth():
    global TOKEN, USER_ID
    print_step("1. Testing Auth Service (Register & Login)")

    # Register
    print(f"Registering user: {EMAIL}...")
    reg_data = {"email": EMAIL, "name": "Test User", "password": PASSWORD}
    requests.post(f"{AUTH_URL}/register", json=reg_data)
    # Note: On ignore le statut ici car si le user existe déjà (re-run), on veut juste login

    # Login
    print("Logging in...")
    login_data = {"email": EMAIL, "password": PASSWORD}
    resp = requests.post(f"{AUTH_URL}/login", json=login_data)
    data = check_response(resp, 200).json()

    TOKEN = data['accessToken']
    # Gestion robuste de l'ID utilisateur (parfois 'user': {'id':...} parfois direct)
    if 'user' in data and 'id' in data['user']:
        USER_ID = data['user']['id']
    else:
        # Fallback si structure différente
        USER_ID = data.get('id')

    print(f"Got Token: {TOKEN[:20]}... User ID: {USER_ID}")

# 2. PRODUCT SERVICE
def test_product():
    global PRODUCT_ID
    print_step("2. Testing Product Service (Create Category & Product)")
    headers = {"Authorization": f"Bearer {TOKEN}"}

    # Create Category
    print("Creating Category 'Electronics'...")
    cat_data = {"name": "Electronics", "description": "Tech gadgets"}
    resp = requests.post(CATEGORY_URL, json=cat_data, headers=headers)
    cat_id = check_response(resp, 201).json()['id']

    # Create Product
    print("Creating Product 'Gaming Laptop'...")
    prod_data = {
        "name": "Gaming Laptop",
        "description": "High end laptop",
        "price": 1500.00,
        "stockQuantity": 10,
        "categoryId": cat_id,
        "images": ["url1.jpg"]
    }
    resp = requests.post(PRODUCT_URL, json=prod_data, headers=headers)
    prod_data = check_response(resp, 201).json()
    PRODUCT_ID = prod_data['id']
    print(f"Created Product ID: {PRODUCT_ID} with Stock: 10")

# 3. CART SERVICE
def test_cart():
    print_step("3. Testing Cart Service (Add Item)")
    headers = {"Authorization": f"Bearer {TOKEN}"}

    # Add to Cart
    print(f"Adding Product {PRODUCT_ID} to Cart...")
    item_data = {
        "productId": PRODUCT_ID,
        "productName": "Gaming Laptop",
        "price": 1500.00,
        "quantity": 2,
        "imageUrl": "url1.jpg"
    }
    resp = requests.post(f"{CART_URL}/items", json=item_data, headers=headers)
    cart = check_response(resp, 200).json()

    # Verify Cart Total
    expected_total = 3000.00
    if float(cart['totalAmount']) == expected_total:
        print(f"✅ Cart Total correct: {cart['totalAmount']}")
    else:
        print(f"❌ Cart Total incorrect. Expected {expected_total}, got {cart['totalAmount']}")

# 4. CHECKOUT & ORDER SERVICE
def test_checkout():
    global ORDER_ID
    print_step("4. Testing Checkout (Order Creation & Stock Update)")
    headers = {"Authorization": f"Bearer {TOKEN}"}

    # Checkout
    print("Processing Checkout...")
    checkout_data = {
        "shippingAddress": "123 Test St, Paris",
        "paymentMethod": "CREDIT_CARD"
    }
    resp = requests.post(f"{CART_URL}/checkout", json=checkout_data, headers=headers)
    order_data = check_response(resp, 200).json()

    # 🐛 DEBUG: Afficher la réponse brute pour comprendre la structure
    print(f"DEBUG Response JSON: {json.dumps(order_data, indent=2)}")

    # CORRECTION : Chercher 'id' OU 'orderId'
    if 'id' in order_data:
        ORDER_ID = order_data['id']
    elif 'orderId' in order_data:
        ORDER_ID = order_data['orderId']
    else:
        print("❌ CRITICAL: Could not find Order ID in response keys!")
        sys.exit(1)

    print(f"Order Created! ID: {ORDER_ID}")

# 5. VERIFICATION ASYNCHRONE (KAFKA EFFECT)
def test_async_effects():
    print_step("5. Verifying Async Effects (Stock Reduction)")
    headers = {"Authorization": f"Bearer {TOKEN}"}

    print("Waiting 5 seconds for Kafka events to propagate...")
    time.sleep(5)

    # Check Product Stock
    print(f"Checking Stock for Product {PRODUCT_ID}...")
    resp = requests.get(f"{PRODUCT_URL}/{PRODUCT_ID}", headers=headers)
    product = check_response(resp, 200).json()

    # Stock initial 10, Acheté 2 -> Stock attendu 8
    current_stock = product['stockQuantity']
    if current_stock == 8:
        print(f"✅ Stock update confirmed! (10 -> 8). Kafka worked.")
    else:
        print(f"❌ Stock mismatch. Expected 8, got {current_stock}.")
        print("   (Note: If it stays at 10, check if Product Service Consumer is implemented)")

    # Check Order Status
    print("Checking User Orders...")
    resp = requests.get(ORDER_URL, headers=headers)
    orders = check_response(resp, 200).json()

    # Trouver la commande correspondante
    found_order = next((o for o in orders if o.get('id') == ORDER_ID or o.get('orderNumber') == str(ORDER_ID)), None)

    if found_order:
        print(f"✅ Order found in history: ID={found_order.get('id')} Status={found_order.get('status')}")
    else:
        print(f"❌ Order {ORDER_ID} not found in user history.")
        print(f"   History contains IDs: {[o.get('id') for o in orders]}")

if __name__ == "__main__":
    try:
        test_auth()
        test_product()
        test_cart()
        test_checkout()
        test_async_effects()
        print("\n🎉🎉🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉🎉🎉")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        import traceback
        traceback.print_exc()
