from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

# Import emergentintegrations
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:
    print("Warning: emergentintegrations not installed. Please install: pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/")
    LlmChat = None
    UserMessage = None

app = FastAPI(title="Karaman Medical Stock API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProductDescriptionRequest(BaseModel):
    product_name: str
    brand: str = ""
    category: str = ""

class ProductDescriptionResponse(BaseModel):
    description: str
    success: bool
    error: str = None

@app.get("/")
async def root():
    return {"message": "Karaman Medical Stock API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/generate-description", response_model=ProductDescriptionResponse)
async def generate_description(request: ProductDescriptionRequest):
    """Generate product description using AI (Emergent LLM Key)"""
    
    # Check if emergentintegrations is available
    if not LlmChat or not UserMessage:
        raise HTTPException(
            status_code=500,
            detail="emergentintegrations library not installed"
        )
    
    # Get API key from environment
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="EMERGENT_LLM_KEY not found in environment variables"
        )
    
    try:
        # Create prompt
        prompt = f"""Sen bir medikal ürün uzmanısın. Aşağıdaki ürün için profesyonel ve bilgilendirici bir açıklama yaz (maksimum 150 kelime):

Ürün Adı: {request.product_name}
Marka: {request.brand or 'Belirtilmemiş'}
Kategori: {request.category or 'Medikal Ürün'}

Açıklama Türkçe olmalı, ürünün özelliklerini, kullanım alanlarını ve faydalarını içermeli."""
        
        # Initialize LlmChat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"product-desc-{request.product_name[:20]}",
            system_message="Sen bir medikal ürün uzmanısın. Kısa ve öz açıklamalar yazarsın."
        ).with_model("openai", "gpt-4o-mini")
        
        # Create user message
        user_message = UserMessage(text=prompt)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Extract text from response
        description_text = ""
        if isinstance(response, str):
            description_text = response
        elif hasattr(response, 'text'):
            description_text = response.text
        elif hasattr(response, 'content'):
            description_text = response.content
        else:
            description_text = str(response)
        
        return ProductDescriptionResponse(
            description=description_text.strip(),
            success=True
        )
        
    except Exception as e:
        print(f"Error generating description: {str(e)}")
        import traceback
        traceback.print_exc()
        return ProductDescriptionResponse(
            description="",
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
