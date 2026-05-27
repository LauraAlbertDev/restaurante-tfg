import os
import time
from fastapi import UploadFile


class FileService:
    UPLOAD_DIR = "/app/assets/images"

    @classmethod
    async def save_image(cls, file: UploadFile, old_image: str = None) -> str:
        if not file or not file.filename:
            return old_image or "placeholder.jpg"

        os.makedirs(cls.UPLOAD_DIR, exist_ok=True)

        if old_image and old_image != "placeholder.jpg":
            cls.delete_image(old_image)

        timestamp = int(time.time())
        safe_filename = file.filename.replace(' ', '_')
        clean_name = f"{timestamp}_{safe_filename}"

        file_path = os.path.join(cls.UPLOAD_DIR, clean_name)

        try:
            content = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            print(f"DEBUG DOCKER: Archivo escrito con éxito en -> {file_path}")
        except Exception as e:
            print(f"ERROR CRÍTICO ESCRIBIENDO EN DISCO: {e}")
            return "placeholder.jpg"

        return clean_name

    @classmethod
    def delete_image(cls, filename: str):
        if not filename or filename == "placeholder.jpg":
            return

        clean_filename = filename.replace("assets/images/", "")
        file_path = os.path.join(cls.UPLOAD_DIR, clean_filename)

        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"DEBUG DOCKER: Archivo borrado con éxito -> {file_path}")
            except Exception as e:
                print(f"Error al borrar {file_path}: {e}")