import io
import pandas as pd
from fastapi import HTTPException

class ProductService:
    @staticmethod
    def parse_import_file(contents: bytes, filename: str) -> list:
        try:
            buffer = io.BytesIO(contents)
            if filename.endswith('.csv'):
                df = pd.read_csv(buffer)
            else:
                df = pd.read_excel(buffer, engine='openpyxl')

            df.columns = [c.lower().strip() for c in df.columns]

            required = ['name', 'price', 'category']
            if not all(col in df.columns for col in required):
                raise ValueError(f"Faltan columnas obligatorias: {required}")

            return df.to_dict(orient='records')
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error en formato de datos: {str(e)}")

    @staticmethod
    def prepare_export_data(products: list) -> io.BytesIO:
        df = pd.DataFrame(products)
        if 'description' not in df.columns:
            df['description'] = ''
        if not df.empty and 'allergens' in df.columns:
            df['allergens'] = df['allergens'].apply(
                lambda x: ", ".join([a['name'] for a in x]) if x else ""
            )

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Productos')
        output.seek(0)
        return output