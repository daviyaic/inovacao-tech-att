// Funcionalidades modernas para o chat de IA

// Configurações globais
const CONFIG = {
    animationDuration: 300,
    typingSpeed: 50,
    autoScrollDelay: 100
};

// Estado da aplicação
let isLoading = false;
let typingTimeout = null;

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Adicionar indicadores de carregamento
    addLoadingStates();
    
    // Melhorar a experiência do formulário
    enhanceFormExperience();
    
    // Adicionar animações suaves
    addSmoothAnimations();
    
    // Configurar auto-scroll do chat
    setupAutoScroll();
    
    // Adicionar atalhos de teclado
    addKeyboardShortcuts();
    
    // Melhorar modais
    enhanceModals();
}

// Função original para abrir modal RAG com melhorias
function abrirModalRAG() {
    if (isLoading) return;
    
    setLoadingState(true);
    showModal('ragModal');
    
    // Adicionar indicador de carregamento
    const ragContent = document.getElementById('ragContent');
    ragContent.innerHTML = '<div class="loading-spinner">🔄 Carregando documentos...</div>';
    
    fetch('/api/rag')
        .then(res => {
            if (!res.ok) throw new Error('Erro na requisição');
            return res.text();
        })
        .then(data => {
            // Simular efeito de digitação
            typeText(ragContent, data);
        })
        .catch(error => {
            ragContent.innerHTML = `<div class="error-message">❌ Erro ao carregar: ${error.message}</div>`;
        })
        .finally(() => {
            setLoadingState(false);
        });
}

// Função original para abrir modal Juiz com melhorias
function abrirModalJuiz() {
    if (isLoading) return;
    
    setLoadingState(true);
    showModal('juizModal');
    
    // Adicionar indicador de carregamento
    const juizContent = document.getElementById('juizContent');
    juizContent.innerHTML = '<div class="loading-spinner">⚖️ Analisando...</div>';
    
    fetch('/api/juiz')
        .then(res => {
            if (!res.ok) throw new Error('Erro na requisição');
            return res.json();
        })
        .then(data => {
            // Simular efeito de digitação
            typeText(juizContent, data.resultado || 'Análise concluída');
        })
        .catch(error => {
            juizContent.innerHTML = `<div class="error-message">❌ Erro ao analisar: ${error.message}</div>`;
        })
        .finally(() => {
            setLoadingState(false);
        });
}

// Função melhorada para fechar modal
function fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = '';
        }, 200);
    }
}

// Função para mostrar modal com animação
function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'block';
        modal.style.animation = 'fadeIn 0.2s ease';
    }
}

// Efeito de digitação para texto
function typeText(element, text, speed = CONFIG.typingSpeed) {
    if (typingTimeout) clearTimeout(typingTimeout);
    
    element.innerHTML = '';
    let index = 0;
    
    function type() {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
            typingTimeout = setTimeout(type, speed);
            
            // Auto-scroll se necessário
            if (element.scrollHeight > element.clientHeight) {
                element.scrollTop = element.scrollHeight;
            }
        }
    }
    
    type();
}

// Gerenciar estado de carregamento
function setLoadingState(loading) {
    isLoading = loading;
    const buttons = document.querySelectorAll('button, input[type="submit"]');
    
    buttons.forEach(button => {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    });
}

// Adicionar estados de carregamento visuais
function addLoadingStates() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
            animation: pulse 2s infinite;
        }
        
        .error-message {
            color: var(--danger-color);
            padding: 1rem;
            text-align: center;
            font-size: 0.875rem;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .button-loading {
            position: relative;
            overflow: hidden;
        }
        
        .button-loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
        }
    `;
    document.head.appendChild(style);
}

// Melhorar experiência do formulário
function enhanceFormExperience() {
    const messageInput = document.getElementById('mensagem');
    const form = document.querySelector('form');
    
    if (messageInput) {
        // Auto-resize do input
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        // Placeholder dinâmico
        const placeholders = [
            'Digite sua mensagem...',
            'Como posso ajudar?',
            'Faça sua pergunta...',
            'Descreva seu problema...'
        ];
        
        let placeholderIndex = 0;
        setInterval(() => {
            if (!messageInput.value && document.activeElement !== messageInput) {
                messageInput.placeholder = placeholders[placeholderIndex];
                placeholderIndex = (placeholderIndex + 1) % placeholders.length;
            }
        }, 3000);
        
        // Foco automático
        messageInput.focus();
    }
    
    // Prevenir envio de formulário vazio
    if (form) {
        form.addEventListener('submit', function(e) {
            const messageValue = messageInput?.value?.trim();
            if (!messageValue && e.submitter?.name === 'enviar') {
                e.preventDefault();
                messageInput?.focus();
                showNotification('Por favor, digite uma mensagem antes de enviar.', 'warning');
            }
        });
    }
}

// Adicionar animações suaves
function addSmoothAnimations() {
    // Animação de entrada para elementos
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideInUp 0.5s ease forwards';
            }
        });
    });
    
    document.querySelectorAll('.container, .index-container').forEach(el => {
        observer.observe(el);
    });
    
    // Adicionar CSS para animações
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Configurar auto-scroll do chat
function setupAutoScroll() {
    const chatBox = document.querySelector('.chat-box pre');
    if (chatBox) {
        // Observer para detectar mudanças no conteúdo
        const observer = new MutationObserver(() => {
            setTimeout(() => {
                chatBox.scrollTop = chatBox.scrollHeight;
            }, CONFIG.autoScrollDelay);
        });
        
        observer.observe(chatBox, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
}

// Adicionar atalhos de teclado
function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter para enviar
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const sendButton = document.querySelector('input[name="enviar"]');
            if (sendButton && !isLoading) {
                sendButton.click();
            }
        }
        
        // Escape para fechar modais
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                const modalId = openModal.id;
                fecharModal(modalId);
            }
        }
        
        // Ctrl/Cmd + R para RAG
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            abrirModalRAG();
        }
        
        // Ctrl/Cmd + J para Juiz
        if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
            e.preventDefault();
            abrirModalJuiz();
        }
    });
}

// Melhorar modais
function enhanceModals() {
    // Fechar modal clicando fora
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            const modalId = e.target.id;
            fecharModal(modalId);
        }
    });
    
    // Adicionar tooltips para botões
    const ragButton = document.querySelector('button[onclick*="abrirModalRAG"]');
    const juizButton = document.querySelector('button[onclick*="abrirModalJuiz"]');
    
    if (ragButton) {
        ragButton.title = 'Consultar Base de Conhecimento (Ctrl+R)';
    }
    
    if (juizButton) {
        juizButton.title = 'Análise do Juiz (Ctrl+J)';
    }
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos da notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        fontSize: '14px',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Cores baseadas no tipo
    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Adicionar ao DOM
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Adicionar CSS para animações se não existir
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Função para copiar texto (útil para respostas do chat)
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Texto copiado para a área de transferência!', 'success');
    }).catch(() => {
        showNotification('Erro ao copiar texto', 'error');
    });
}

// Adicionar funcionalidade de cópia ao chat (se necessário)
function addCopyFunctionality() {
    const chatBox = document.querySelector('.chat-box pre');
    if (chatBox) {
        chatBox.addEventListener('dblclick', function() {
            const selection = window.getSelection();
            if (selection.toString()) {
                copyToClipboard(selection.toString());
            }
        });
    }
}

// Função para detectar tema do sistema
function detectSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        // Usuário prefere tema claro - podemos ajustar se necessário
        document.documentElement.style.setProperty('--primary-bg', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#000000');
    }
}

// Inicializar funcionalidades adicionais
document.addEventListener('DOMContentLoaded', function() {
    addCopyFunctionality();
    detectSystemTheme();
    
    // Mostrar dica de atalhos na primeira visita
    if (!localStorage.getItem('shortcuts-shown')) {
        setTimeout(() => {
            showNotification('Dica: Use Ctrl+Enter para enviar, Ctrl+R para RAG, Ctrl+J para Juiz', 'info');
            localStorage.setItem('shortcuts-shown', 'true');
        }, 2000);
    }
});

