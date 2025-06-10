from flask import Blueprint, render_template, request, jsonify
from datetime import datetime
import os
import difflib
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import initialize_agent, AgentType
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate

# Configuração do blueprint
bp = Blueprint("chat", __name__)

# Variáveis de log
LOG = "logs/conversa.log"
LOG_ATENDENTE = "logs/atendente.log"
LOG_USUARIO = "logs/usuario.log"

# Carregar .env e configurar LLM
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=api_key)

# Prompt do juiz
prompt_juiz_template = """Você é um juiz de IA. Avalie se a seguinte afirmação é correta (SIM/NAO) e justifique: "{afirmacao}", a informação precisa ser correta, porém você pode colocar algum humor na frase, tipo piadas, como se fosse um juiz engraçado."""
prompt_juiz = ChatPromptTemplate.from_template(prompt_juiz_template)

# Funções utilitárias
def registrar_log(origem, mensagem):
    os.makedirs("logs", exist_ok=True)
    if mensagem and mensagem.strip():
        try:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            with open(LOG, "a", encoding="utf-8") as f:
                f.write(f"[{timestamp}] [{origem.upper()}] {mensagem.strip()}\n")
            if origem == "atendente":
                with open(LOG_ATENDENTE, "a", encoding="utf-8") as f:
                    f.write(f"[{timestamp}] {mensagem.strip()}\n")
            elif origem == "usuário":
                with open(LOG_USUARIO, "a", encoding="utf-8") as f:
                    f.write(f"[{timestamp}] {mensagem.strip()}\n")
        except IOError as e:
            print(f"Erro ao registrar log: {e}")

def carregar_historico():
    if not os.path.exists(LOG):
        return []
    try:
        with open(LOG, "r", encoding="utf-8") as f:
            linhas = list(f.readlines())
        coloridas = []
        for l in linhas:
            if "[USUÁRIO]" in l:
                classe = "user-message"
            elif "[ATENDENTE]" in l:
                classe = "attendant-message"
            else:
                classe = "system-message"
            coloridas.append(f'<span class="{classe}">{l.strip()}</span>')
        return coloridas
    except IOError as e:
        print(f"Erro ao carregar histórico: {e}")
        return []

def carregar_conversa():
    try:
        return open(LOG, encoding="utf-8").read() if os.path.exists(LOG) else ""
    except IOError as e:
        print(f"Erro ao carregar conversa: {e}")
        return ""

def consultar_rag(pergunta):
    base = []
    documentos_dir = "documentos"
    os.makedirs(documentos_dir, exist_ok=True)

    for nome in os.listdir(documentos_dir):
        if nome.endswith(".txt"):
            try:
                with open(f"{documentos_dir}/{nome}", encoding="utf-8") as f:
                    base.append(f.read())
            except IOError as e:
                print(f"Erro ao ler documento {nome}: {e}")
    texto = "\n".join(base)
    sentencas = texto.split(". ")
    melhores = difflib.get_close_matches(pergunta, sentencas, n=3, cutoff=0.4)
    return "\n".join(melhores)

def avaliar_conversa(conversa):
    try:
        afirmacao = (
            "Abaixo está uma conversa entre um atendente de IA e um usuário. "
            "Avalie se ela contém informações factuais, se há possíveis alucinações "
            "ou afirmações incorretas. Seja objetivo e justifique com base na conversa.\n\n"
            f"{conversa}"
        )

        input_juiz = prompt_juiz.format(afirmacao=afirmacao)
        output = llm.invoke(input_juiz)
        return output.content

    except Exception as e:
        return f"Ocorreu um erro ao executar o juiz: {e}"

# Rotas
@bp.route("/")
def home():
    return render_template("index.html")

@bp.route("/usuario", methods=["GET", "POST"])
def usuario():
    if request.method == "POST":
        if "enviar" in request.form:
            mensagem = request.form.get("mensagem", "")
            registrar_log("usuário", mensagem)
        elif "encerrar" in request.form:
            registrar_log("usuário", "CONVERSA ENCERRADA PELO USUÁRIO")
    return render_template("usuario.html", historico=carregar_historico(), cargo="Usuário")

@bp.route("/atendente", methods=["GET", "POST"])
def atendente():
    if request.method == "POST":
        if "enviar" in request.form:
            mensagem = request.form.get("mensagem", "")
            registrar_log("atendente", mensagem)
        elif "encerrar" in request.form:
            registrar_log("atendente", "CONVERSA ENCERRADA PELO ATENDENTE")
    return render_template("atendente.html", historico=carregar_historico(), cargo="Atendente")

@bp.route("/api/rag")
def api_rag():
    contexto = carregar_conversa()
    if len(contexto) > 500:
        contexto = contexto[-500:]
    resultado = consultar_rag(contexto)
    return resultado

@bp.route("/api/juiz")
def api_juiz():
    conversa = carregar_conversa()
    resultado = avaliar_conversa(conversa)
    return jsonify({"resultado": resultado})


@bp.route("/api/clear_chat", methods=["POST"])
def api_clear_chat():
    try:
        if os.path.exists(LOG):
            os.remove(LOG)
        if os.path.exists(LOG_ATENDENTE):
            os.remove(LOG_ATENDENTE)
        if os.path.exists(LOG_USUARIO):
            os.remove(LOG_USUARIO)
        return jsonify({"status": "success", "message": "Chat limpo com sucesso."}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Erro ao limpar o chat: {e}"}), 500


