from flask import Flask, request, jsonify, session
from flask_cors import CORS
import csv
import io
from google.generativeai import configure, GenerativeModel
import random
import os
from json import loads
import sqlite3

# --- Flask App Config ---
app = Flask(__name__)
app.secret_key = "Urkey"
CORS(app)

# --- Gemini Config ---
configure(api_key="Urkey")
model = GenerativeModel(model_name="models/gemini-1.5-flash-latest")

# --- Database Setup ---
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- Alert Checker ---
def check_alerts(devices, thresholds):
    alerts = []
    total_energy = sum(d['energy'] for d in devices)

    for device in devices:
        name = device['name']
        power = device['power']
        hours = device['hours']
        energy = device['energy']
        limit = thresholds.get(name, {})

        if limit.get('max_energy') and energy > limit['max_energy']:
            alerts.append(f"High usage alert for {name} - {energy:.2f} kWh")
        if limit.get('max_hours') and hours > limit['max_hours']:
            alerts.append(f"Extended usage alert: {name} used for {hours} hrs")

    # Only show total energy alert if a global max is set and exceeded
    if thresholds.get('total_energy') is not None and total_energy > thresholds['total_energy']:
        alerts.append(f"Total energy usage is high: {total_energy:.2f} kWh")

    return alerts

# --- Simulate Device Usage ---
def simulate_device_usage():
    devices = [
        {"name": "Air Conditioner", "power": 1.5},
        {"name": "Refrigerator", "power": 0.2},
        {"name": "Washing Machine", "power": 0.5},
        {"name": "Laptop", "power": 0.1},
        {"name": "Television", "power": 0.08},
    ]
    for device in devices:
        device["hours"] = round(random.uniform(1, 12), 2)
        device["energy"] = round(device["power"] * device["hours"], 2)
    return devices

# --- Parse CSV ---
def parse_csv(file_stream):
    devices = []
    decoded = file_stream.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    # Map headers to lowercase for flexible matching
    field_map = {h.lower(): h for h in reader.fieldnames}
    required_fields = {'name', 'power', 'hours'}
    if not all(f in field_map for f in required_fields):
        missing = required_fields - set(field_map)
        raise ValueError(f"CSV missing required columns: {', '.join(missing)}")
    for row in reader:
        try:
            power = float(row[field_map['power']])
            hours = float(row[field_map['hours']])
            devices.append({
                "name": row[field_map['name']],
                "power": power,
                "hours": hours,
                "energy": round(power * hours, 2)
            })
        except (ValueError, KeyError) as e:
            raise ValueError(f"Invalid data in CSV row: {row}")
    return devices

# --- Create Prompt for Gemini ---
def create_prompt(devices, user_query, is_first_time):
    intro = """
You are a smart, helpful assistant called 'Energy Consumption Monitor Bot'.
You help users understand and manage their household or office device energy usage.

Your tasks include:
- Breaking down device energy consumption into daily, weekly, or monthly summaries
- Categorizing devices (e.g., Kitchen, Entertainment, Office, etc.)
- Highlighting high-energy-consuming or overused devices
- Suggesting ways to reduce energy consumption or optimize device usage
- Estimating energy usage for unknown or new devices based on typical values
Only when asked about it

Devices provided by the user (with details like device name, power, and hours used) should be your main data source, but you can also use general knowledge when needed.

Make your response clear and concise, and avoid unnecessary jargon. Use bullet points or lists for clarity when appropriate.

Here are the user's devices:
""" if is_first_time else "Respond concisely. No greeting needed."

    prompt = f"{intro}\n\nDevices and usage:\n"
    for d in devices:
        prompt += f"- {d['name']}: {d['power']}kW for {d['hours']} hrs = {d['energy']} kWh\n"
    prompt += f"\nUser's Query: {user_query}"
    return prompt

# --- API Endpoint ---
@app.route('/simulate', methods=['POST'])
def simulate():
    user_query = request.form.get("query", "")
    file = request.files.get("file")
    thresholds_json = request.form.get("thresholds")
    try:
        thresholds = loads(thresholds_json) if thresholds_json else {}
    except Exception as e:
        thresholds = {}
    
    if not user_query and not file:
        return jsonify({"error": "No query or file provided"}), 400

    devices = []
    if file:
        try:
            devices = parse_csv(file)
        except Exception as e:
            return jsonify({"error": f"CSV Parse Error: {str(e)}"}), 400
    else:
        devices = simulate_device_usage()

    is_first_time = not session.get("greeted")
    if is_first_time:
        session["greeted"] = True

    # Use default query for CSV uploads without user query
    if not user_query and file:
        user_query = "Analyze the energy usage from the uploaded CSV file, do not write paragraph give answers in points. Avoid using ** or any other formatting."

    prompt = create_prompt(devices, user_query, is_first_time)
    response = model.generate_content(prompt)
    reply = response.text.strip()

    # Remove all '*' characters from the reply
    reply = reply.replace('*', '')

    alerts = check_alerts(devices, thresholds)

    return jsonify({
        "response": reply,
        "alerts": alerts,
        "devices": devices
    })

# --- User Auth Endpoints ---
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT password FROM users WHERE username = ?', (username,))
    row = c.fetchone()
    conn.close()
    if row and row[0] == password:
        session['username'] = username
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Invalid username or password"}), 401

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('SELECT username FROM users WHERE username = ?', (username,))
    if c.fetchone():
        conn.close()
        return jsonify({"success": False, "error": "Username already exists"}), 409
    c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
    conn.commit()
    conn.close()
    session['username'] = username
    return jsonify({"success": True})

# --- Run App ---
if __name__ == '__main__':
    app.run(debug=True)