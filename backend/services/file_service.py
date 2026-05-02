import os
import time
from fastapi import UploadFile

class FileService:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR = os.path.join(BASE_DIR, "..", "frontend", "public", "assets", "images")

    @classmethod
    async def save_image(cls, file: UploadFile, old_image: str = None) -> str:
        if not file or not file.filename:
            return old_image or "placeholder.jpg"

        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)

        # Si tenemos una imagen vieja, la borramos antes de guardar la nueva
        if old_image and old_image != "placeholder.jpg":
            cls.delete_image(old_image)

        # Generamos el nombre.
        # NOTA: Mantener el timestamp es bueno para evitar caché del navegador,
        # pero ahora estamos borrando el anterior antes de crear este.
        clean_name = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(cls.UPLOAD_DIR, clean_name)

        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        return clean_name

    @classmethod
    def delete_image(cls, filename: str):
        if filename and filename != "placeholder.jpg":
            file_path = os.path.join(cls.UPLOAD_DIR, filename)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error borrando archivo: {e}")