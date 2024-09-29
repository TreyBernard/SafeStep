import cv2
from ultralytics import YOLO
from flask import Flask, jsonify
from flask_cors import CORS 
import threading 

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})  

crosswalk_data = {"detected": False, "confidence": 0.0}

class WebcamDetection:
    def __init__(self, model_path):
        self.model = YOLO(model_path)
        self.cap = cv2.VideoCapture(0)  
        if not self.cap.isOpened():
            print("Error: Could not open webcam")

    def check_crosswalk_detection(self, boxes):
        """Check for crosswalk detection with confidence above 80%."""
        global crosswalk_data
        detected = False
        confidence = 0.0
        
        for box in boxes:
            conf = box.conf[0].item() 
            cls = int(box.cls[0])  

            if self.model.names[cls] == "crosswalk" and conf > 0.80:
                detected = True
                confidence = conf

        crosswalk_data["detected"] = detected
        crosswalk_data["confidence"] = confidence


    def run_crosswalk_detection(self):
        while True:
            ret, frame = self.cap.read()
            if not ret:
                print("Error: Failed to capture frame")
                break

            results = self.model.predict(source=frame, conf=0.9)

            for result in results:
                boxes = result.boxes 
                
                self.check_crosswalk_detection(boxes)  
                
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])  
                    conf = box.conf[0]  
                    cls = int(box.cls[0]) 
                    label = f"{self.model.names[cls]}: {conf:.2f}" 

                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            cv2.imshow('Webcam', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    def cleanup(self):
        self.cap.release()
        cv2.destroyAllWindows()

@app.route('/api/crosswalk', methods=['GET'])
def get_crosswalk_detection():
    return jsonify(crosswalk_data)

def run_flask():
    app.run(port=5000)  


if __name__ == "__main__":
    threading.Thread(target=run_flask).start()  
    detector = WebcamDetection("VisualAssistance/code/runs/detect/train3/weights/best1.pt")
    detector.run_crosswalk_detection()
    detector.cleanup()
