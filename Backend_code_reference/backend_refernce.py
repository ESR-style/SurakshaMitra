from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import numpy as np
import re
import pickle
import ast
import types
import sys
import json
from typing import Optional, List
import uvicorn

# 🩹 Fix the keras path before anything loads
import keras
import keras.models

# Create the full module structure that pickle expects
if not hasattr(keras, 'src'):
    keras.src = types.SimpleNamespace()
if not hasattr(keras.src, 'models'):
    keras.src.models = types.SimpleNamespace()

# Map the classes
keras.src.models.sequential = keras.models.Sequential
keras.src.models.Sequential = keras.models.Sequential

# Also add to sys.modules to help with pickle loading
sys.modules['keras.src'] = keras.src
sys.modules['keras.src.models'] = keras.src.models
sys.modules['keras.src.models.sequential'] = keras.models

app = FastAPI(title="Keystroke Authentication API", version="1.0.0")

# Global variables to store loaded models
captcha_auth_system = None
pin_auth_system = None

@app.on_event("startup")
async def load_models():
    global captcha_auth_system, pin_auth_system
    
    try:
        # Load captcha authentication system
        with open('keystroke_authentication_system.pkl', 'rb') as f:
            captcha_auth_system = pickle.load(f)
        print("✅ Captcha authentication system loaded successfully")
        
        # Load PIN authentication system
        with open('pin_authentication.pkl', 'rb') as f:
            pin_auth_system = pickle.load(f)
        print("✅ PIN authentication system loaded successfully")
        
    except FileNotFoundError as e:
        print(f"❌ Error loading authentication systems: {e}")
        raise e

# Pydantic models for request/response
class AuthenticationResponse(BaseModel):
    authenticated: bool
    confidence: float
    threshold: float
    user: str
    target_user: str
    model_type: str

class SecurityCheckResponse(BaseModel):
    authenticated: bool
    message: str
    details: dict

class TwoFactorResponse(BaseModel):
    authenticated: bool
    message: str
    choice: int

class EmulatorResponse(BaseModel):
    authenticated: bool
    message: str
    result: str

class WifiSafetyResponse(BaseModel):
    authenticated: bool
    message: str
    choice: int

class FirstActionResponse(BaseModel):
    authenticated: bool
    message: str
    action: str

class NavigationResponse(BaseModel):
    authenticated: bool
    message: str
    method: str

# Utility functions
def parse_array(array_str):
    if isinstance(array_str, str):
        if array_str.startswith('[') and ';' in array_str:
            try:
                vals = array_str.strip('[]').split(';')
                return [int(x) for x in vals]
            except:
                pass
        try:
            return [int(x) for x in re.findall(r'\d+', array_str)]
        except:
            return []
    return []

def extract_features(sample):
    # Flight time features
    flight_times = sample['flightTimesArray']
    ft_features = []
    
    if flight_times and len(flight_times) > 1:
        ft_mean = np.mean(flight_times)
        ft_std = np.std(flight_times)
        ft_median = np.median(flight_times)
        ft_normalized = [t/ft_mean if ft_mean > 0 else 0 for t in flight_times]
        ft_transitions = np.diff(flight_times)
        trans_mean = np.mean(ft_transitions) if len(ft_transitions) > 0 else 0
        trans_std = np.std(ft_transitions) if len(ft_transitions) > 1 else 0
        
        ft_features = [
            ft_mean/1000.0, ft_std/1000.0, ft_median/1000.0,
            trans_mean/1000.0, trans_std/1000.0
        ]
        
        # Add normalized times (up to 5)
        ft_features.extend(ft_normalized[:5] if len(ft_normalized) > 5 else 
                          ft_normalized + [0] * (5 - len(ft_normalized)))
    else:
        ft_features = [0] * 10
    
    # Dwell time features
    dwell_times = sample['dwellTimesArray']
    dt_features = []
    
    if dwell_times and len(dwell_times) > 0:
        dt_mean = np.mean(dwell_times)
        dt_std = np.std(dwell_times) if len(dwell_times) > 1 else 0
        dt_normalized = [t/dt_mean if dt_mean > 0 else 0 for t in dwell_times]
        
        dt_features = [dt_mean/150.0, dt_std/50.0]
        
        # Add normalized times (up to 3)
        dt_features.extend(dt_normalized[:3] if len(dt_normalized) > 3 else 
                          dt_normalized + [0] * (3 - len(dt_normalized)))
    else:
        dt_features = [0] * 5
    
    # Other features
    typing_features = [
        sample['wpm']/20.0, sample['totalTime']/10.0,
        sample['backspaceCount']/5.0, sample['keyDwellVariance']/50.0
    ]
    
    touch_features = [
        sample['avgTouchArea']/600.0, sample['avgPressure'],
        sample['touchAreaVariance']/200.0, sample['pressureVariance']/0.2
    ]
    
    coord_features = [
        sample['avgCoordX']/300.0, sample['avgCoordY']/50.0
    ]
    
    # Combine all features and handle NaN values
    all_features = typing_features + ft_features + dt_features + touch_features + coord_features
    all_features = [0 if np.isnan(x) else x for x in all_features]
    
    return all_features

def parse_csv_line(csv_line):
    """Parse CSV line handling both captcha and PIN formats"""
    parts = []
    current_part = ''
    in_quotes = False
    in_brackets = False
    
    for char in csv_line:
        if char == '"':
            in_quotes = not in_quotes
        elif char == '[':
            in_brackets = True
            current_part += char
        elif char == ']':
            in_brackets = False
            current_part += char
        elif char == ',' and not in_quotes and not in_brackets:
            parts.append(current_part.strip('"'))
            current_part = ''
        else:
            current_part += char
            
    # Add the last part
    if current_part:
        parts.append(current_part.strip('"'))
    
    return parts

@app.post("/authenticate/captcha", response_model=AuthenticationResponse)
async def authenticate_captcha(request: Request):
    """Authenticate using captcha keystroke dynamics"""
    if captcha_auth_system is None:
        raise HTTPException(status_code=500, detail="Captcha authentication system not loaded")
    
    try:
        # Get raw body as text
        csv_data = (await request.body()).decode('utf-8')
        
        # Use the same parsing logic from captchaModel.py
        parts = []
        current_part = ''
        in_quotes = False
        
        for char in csv_data:
            if char == '"':
                in_quotes = not in_quotes
            elif char == ',' and not in_quotes:
                parts.append(current_part.strip('"'))
                current_part = ''
            else:
                current_part += char
                
        # Add the last part
        if current_part:
            parts.append(current_part.strip('"'))
        
        # Create sample for captcha authentication
        sample = {
            'username': parts[0],
            'captcha': parts[1],
            'userInput': parts[2],
            'isCorrect': parts[3].lower() == 'true',
            'timestamp': parts[4],
            'totalTime': float(parts[5]),
            'wpm': float(parts[6]),
            'backspaceCount': float(parts[7]),
            'avgFlightTime': float(parts[8]),
            'avgDwellTime': float(parts[9]),
            'avgInterKeyPause': float(parts[10]),
            'sessionEntropy': float(parts[11]),
            'keyDwellVariance': float(parts[12]),
            'interKeyVariance': float(parts[13]),
            'pressureVariance': float(parts[14]),
            'touchAreaVariance': float(parts[15]),
            'avgTouchArea': float(parts[16]),
            'avgPressure': float(parts[17]),
            'avgCoordX': float(parts[18]),
            'avgCoordY': float(parts[19]),
            'avgErrorRecoveryTime': float(parts[20]),
            'characterCount': float(parts[21]),
            'flightTimesArray': parse_array(parts[22]),
            'dwellTimesArray': parse_array(parts[23]),
            'interKeyPausesArray': parse_array(parts[24])
        }
        
        model = captcha_auth_system['model']
        scaler = captcha_auth_system['scaler']
        threshold = captcha_auth_system['threshold']
        target_user = captcha_auth_system['target_user']
        
        # Extract and scale features
        features = np.array([extract_features(sample)])
        scaled_features = scaler.transform(features)
        
        # Get prediction
        confidence = model.predict(scaled_features, verbose=0)[0][0]
        is_authenticated = confidence >= threshold
        
        return AuthenticationResponse(
            authenticated=is_authenticated,
            confidence=float(confidence),
            threshold=float(threshold),
            user=sample['username'],
            target_user=target_user,
            model_type="captcha"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing captcha authentication: {str(e)}")

@app.post("/authenticate/pin", response_model=AuthenticationResponse)
async def authenticate_pin(request: Request):
    """Authenticate using PIN keystroke dynamics"""
    if pin_auth_system is None:
        raise HTTPException(status_code=500, detail="PIN authentication system not loaded")
    
    try:
        # Get raw body as text
        csv_data = (await request.body()).decode('utf-8')
        
        # Use the same parsing logic from pinModel.py
        parts = []
        current_part = ''
        in_brackets = False
        
        for char in csv_data:
            if char == '[':
                in_brackets = True
                current_part += char
            elif char == ']':
                in_brackets = False
                current_part += char
            elif char == ',' and not in_brackets:
                parts.append(current_part)
                current_part = ''
            else:
                current_part += char
                
        # Add the last part
        if current_part:
            parts.append(current_part)
        
        # Create sample for PIN authentication
        sample = {
            'username': parts[0],
            'captcha': parts[1],
            'userInput': parts[2],
            'isCorrect': parts[3].lower() == 'true',
            'timestamp': parts[4],
            'totalTime': float(parts[5]),
            'wpm': float(parts[6]),
            'backspaceCount': float(parts[7]),
            'avgFlightTime': float(parts[8]),
            'avgDwellTime': float(parts[9]),
            'avgInterKeyPause': float(parts[10]),
            'sessionEntropy': float(parts[11]),
            'keyDwellVariance': float(parts[12]),
            'interKeyVariance': float(parts[13]),
            'pressureVariance': float(parts[14]),
            'touchAreaVariance': float(parts[15]),
            'avgTouchArea': float(parts[16]),
            'avgPressure': float(parts[17]),
            'avgCoordX': float(parts[18]),
            'avgCoordY': float(parts[19]),
            'avgErrorRecoveryTime': float(parts[20]),
            'characterCount': float(parts[21]),
            'flightTimesArray': parse_array(parts[22]),
            'dwellTimesArray': parse_array(parts[23]),
            'interKeyPausesArray': parse_array(parts[24]),
            'typingPatternVector': parse_array(parts[25]) if len(parts) > 25 else []
        }
        
        model = pin_auth_system['model']
        scaler = pin_auth_system['scaler']
        threshold = pin_auth_system['threshold']
        target_user = pin_auth_system['target_user']
        
        # Extract and scale features
        features = np.array([extract_features(sample)])
        scaled_features = scaler.transform(features)
        
        # Get prediction
        confidence = model.predict(scaled_features, verbose=0)[0][0]
        is_authenticated = confidence >= threshold
        
        return AuthenticationResponse(
            authenticated=is_authenticated,
            confidence=float(confidence),
            threshold=float(threshold),
            user=sample['username'],
            target_user=target_user,
            model_type="pin"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing PIN authentication: {str(e)}")

@app.post("/authenticate/auto", response_model=AuthenticationResponse)
async def authenticate_auto(request: Request):
    """Auto-detect and authenticate using the appropriate model based on data format"""
    # Get raw body as text
    csv_data = (await request.body()).decode('utf-8')
    
    parts = []
    current_part = ''
    in_brackets = False
    
    for char in csv_data:
        if char == '[':
            in_brackets = True
            current_part += char
        elif char == ']':
            in_brackets = False
            current_part += char
        elif char == ',' and not in_brackets:
            parts.append(current_part)
            current_part = ''
        else:
            current_part += char
            
    # Add the last part
    if current_part:
        parts.append(current_part)
    
    # Simple heuristic: if there are more than 25 parts, it's likely PIN data
    if len(parts) > 25:
        return await authenticate_pin(request)
    else:
        return await authenticate_captcha(request)

@app.post("/security/device-check", response_model=SecurityCheckResponse)
async def device_security_check(request: Request):
    """Check device security parameters"""
    try:
        # Get raw body as JSON
        body = await request.body()
        data = json.loads(body.decode('utf-8'))
        
        state = data.get('state', {})
        
        # Check device model and manufacturer
        device_model = state.get('deviceModel', '')
        device_manufacturer = state.get('deviceManufacturer', '')
        
        # Expected values
        expected_model = "RMX3660"
        expected_manufacturer = "realme"
        
        # Check if device matches expected values
        device_match = (device_model == expected_model and device_manufacturer == expected_manufacturer)
        
        # Get other security flags
        is_developer_mode = state.get('isDeveloperMode', False)
        is_usb_debugging = state.get('isUSBDebugging', False)
        is_emulator = state.get('isEmulator', False)
        is_rooted = state.get('isRooted', False)
        
        # Device is authenticated if it matches expected model/manufacturer
        authenticated = device_match
        
        details = {
            "deviceModel": device_model,
            "deviceManufacturer": device_manufacturer,
            "expectedModel": expected_model,
            "expectedManufacturer": expected_manufacturer,
            "deviceMatch": device_match,
            "isDeveloperMode": is_developer_mode,
            "isUSBDebugging": is_usb_debugging,
            "isEmulator": is_emulator,
            "isRooted": is_rooted,
            "securityCheck": data.get('securityCheck', ''),
            "version": data.get('version', '')
        }
        
        message = "Device authenticated" if authenticated else "Device not recognized"
        
        return SecurityCheckResponse(
            authenticated=authenticated,
            message=message,
            details=details
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing device security check: {str(e)}")

@app.post("/security/two-factor", response_model=TwoFactorResponse)
async def two_factor_check(request: Request):
    """Check two-factor authentication choice"""
    try:
        # Get raw body as JSON
        body = await request.body()
        data = ast.literal_eval(body.decode('utf-8'))
        
        choice = data.get('twoFactorChoice', 0)
        
        # Only choice 2 is correct
        authenticated = (choice == 2)
        
        message = "Two-factor choice correct" if authenticated else "Invalid two-factor choice"
        
        return TwoFactorResponse(
            authenticated=authenticated,
            message=message,
            choice=choice
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing two-factor check: {str(e)}")

@app.post("/security/emulator-detection", response_model=EmulatorResponse)
async def emulator_detection_check(request: Request):
    """Check emulator detection result"""
    try:
        # Get raw body as JSON
        body = await request.body()
        data = ast.literal_eval(body.decode('utf-8'))
        
        result = data.get('emulatorDetectionResult', '')
        
        # Only "real_device" is correct
        authenticated = (result == "real_device")
        
        message = "Real device detected" if authenticated else "Emulator or invalid device detected"
        
        return EmulatorResponse(
            authenticated=authenticated,
            message=message,
            result=result
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing emulator detection: {str(e)}")

@app.post("/security/wifi-safety", response_model=WifiSafetyResponse)
async def wifi_safety_check(request: Request):
    """Check WiFi safety choice"""
    try:
        # Get raw body as JSON
        body = await request.body()
        data = ast.literal_eval(body.decode('utf-8'))
        
        choice = data.get('wifiSafetyChoice', 0)
        
        # Only choice 1 is correct
        authenticated = (choice == 1)
        
        message = "WiFi safety choice correct" if authenticated else "Invalid WiFi safety choice"
        
        return WifiSafetyResponse(
            authenticated=authenticated,
            message=message,
            choice=choice
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing WiFi safety check: {str(e)}")

@app.post("/security/first-action", response_model=FirstActionResponse)
async def first_action_check(request: Request):
    """Check first action choice"""
    try:
        # Get raw body as JSON
        body = await request.body()
        data = json.loads(body.decode('utf-8'))
        
        action = data.get('firstAction', '')
        pressed = data.get('pressed', False)
        
        # Only "showBalance" action is correct and pressed should be true
        authenticated = (action == "showBalance" and pressed == True)
        
        message = "First action correct" if authenticated else "Invalid first action"
        
        return FirstActionResponse(
            authenticated=authenticated,
            message=message,
            action=action
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing first action check: {str(e)}")

@app.post("/security/navigation-method", response_model=NavigationResponse)
async def navigation_method_check(request: Request):
    """Check navigation method"""
    try:
        # Get raw body as JSON
        body = await request.body()
        data = ast.literal_eval(body.decode('utf-8'))
        
        method = data.get('navigationMethod', '')
        
        # Only "hardwareBack" method is correct
        authenticated = (method == "hardwareBack")
        
        message = "Navigation method correct" if authenticated else "Invalid navigation method"
        
        return NavigationResponse(
            authenticated=authenticated,
            message=message,
            method=method
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing navigation method check: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Keystroke Authentication API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "captcha_model_loaded": captcha_auth_system is not None,
        "pin_model_loaded": pin_auth_system is not None
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)