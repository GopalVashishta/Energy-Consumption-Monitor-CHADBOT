# Energy Consumption Monitor

This project is a web-based Energy Consumption Monitor that helps users analyze and optimize the energy usage of household or office devices. It uses a Flask backend with a Gemini AI model for smart analysis and recommendations.

## Features

- Upload CSV files with device usage data or simulate device usage.
- Analyze energy consumption and get actionable recommendations.
- Set thresholds for alerts on high or extended usage.
- User authentication (signup/login).
- Modern UI (React frontend, not included here).

## API Endpoints

- `POST /simulate`: Analyze device usage (CSV upload or simulate).
- `POST /login`: User login.
- `POST /signup`: User registration.

## Setup

1. **Clone the repository** and navigate to the project directory.

2. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

3. **Set up Google Gemini API key:**
   - The API key is configured in `app.py`. Replace with your own if needed.

4. **Run the Flask server:**
   ```
   python app.py
   ```

5. **Frontend:**
   - The frontend should be built separately (not included in this repo).

## CSV Format

Example:
```
Name,Power,Hours
Refrigerator,1.3,12
Air conditioner,2.1,9
Laptop,0.8,13
```

## License

MIT License
