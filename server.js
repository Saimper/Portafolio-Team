import express from 'express';
import { WebSocketServer } from 'ws';
import amqp from 'amqplib';

const app = express();
const PORT = 3000;

// Base de conocimiento enriquecida
const KNOWLEDGE_BASE = {
  greetings: {
    welcome: "¡Hola! 👋 Soy Devy, el asistente virtual de SpacesDevs. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre:\n\n• Nuestro **equipo** de expertos\n• Los **proyectos** que hemos desarrollado\n• Nuestra **experiencia** en el mercado\n• Cómo **contactarnos**",
    goodbye: "¡Ha sido un placer ayudarte! 🚀 Si tienes más preguntas, estoy aquí para ayudarte. ¡Que tengas un excelente día!"
  },
  team: {
    intro: "Nuestro equipo está formado por profesionales apasionados por la tecnología:",
    members: {
      joel: {
        name: "👨‍💻 **Joel Solano** - Tech Lead",
        bio: "Con más de 8 años de experiencia en arquitectura de software. Especializado en soluciones escalables y liderazgo técnico. 'Creemos en código limpio y soluciones robustas'",
        skills: "Node.js | Microservicios | AWS | Arquitectura Cloud"
      },
      jorge: {
        name: "👨‍💻 **Jorge Manjarrés** - Backend Developer",
        bio: "Experto en desarrollo backend y bases de datos distribuidas. 'La eficiencia en el código es tan importante como su funcionalidad'",
        skills: "Node.js | Python | MongoDB | PostgreSQL | RabbitMQ"
      },
      eva: {
        name: "👩‍🎨 **Eva Contreras** - UI/UX Designer",
        bio: "Diseñadora de experiencias centradas en el usuario. 'El buen diseño es invisible, solo se nota cuando falta'",
        skills: "Figma | Adobe XD | User Research | Prototipado"
      }
    }
  },
  projects: {
    intro: "Estos son algunos de nuestros proyectos destacados. ¿Te gustaría saber más sobre alguno en particular? (Di el nombre o año del proyecto)",
    list: {
      "sistema de biblioteca": {
        year: "2023",
        description: "🚀 **Sistema de Gestión de Biblioteca**: Solución completa para automatizar procesos en bibliotecas universitarias.",
        challenge: "🔍 **Reto**: Migrar un sistema heredado con datos de 20 años sin interrumpir operaciones.",
        solution: "💡 **Solución**: Implementamos migración progresiva con doble base de datos en paralelo durante 3 meses.",
        technologies: "🛠️ **Tecnologías**: Node.js, React, MongoDB, AWS Lambda",
        impact: "📈 **Impacto**: Reducción del 70% en tiempo de préstamos y 90% en errores de inventario."
      },
      "mesa de ayuda": {
        year: "2024",
        description: "🛠️ **Sistema Mesa de Ayuda**: Plataforma para gestión de tickets de soporte técnico.",
        challenge: "🔍 **Reto**: Alto volumen de tickets (500+/día) con tiempos de respuesta inconsistentes.",
        solution: "💡 **Solución**: Automatización con IA para clasificación y routing inteligente de tickets.",
        technologies: "🛠️ **Tecnologías**: Python, Django, TensorFlow, PostgreSQL",
        impact: "📈 **Impacto**: Tiempos de respuesta reducidos en 60% y satisfacción cliente aumentada a 95%."
      },
      // ... otros proyectos similares
    }
  },
  experience: {
    years: "Llevamos **4+ años** transformando ideas en soluciones digitales.",
    stats: "📊 **Métricas clave**:\n- 50+ proyectos exitosos\n- 100% clientes satisfechos\n- 3 industrias diferentes",
    approach: "💡 **Nuestro enfoque**: Combinamos tecnología punta con metodologías ágiles para entregar soluciones que realmente resuelven problemas."
  },
  contact: {
    options: "📬 **Contáctanos por**:",
    details: {
      email: "✉️ **Email**: contacto@spacesdevs.com",
      whatsapp: "💬 **WhatsApp**: +1 (234) 567-890",
      address: "🏢 **Oficina**: Av. Tecnológica 123, Ciudad Digital"
    },
    availability: "⏰ **Horario**: Lunes a Viernes de 9am a 6pm"
  }
};

app.use(express.static('dist'));

const wss = new WebSocketServer({ noServer: true });
let rabbitChannel;

async function setupRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  rabbitChannel = await connection.createChannel();
  await rabbitChannel.assertQueue('chatbot_queue', { durable: false });
}

function generateResponse(userMessage) {
  const message = userMessage.toLowerCase().trim();
  
  // Detección de intención mejorada
  if (/hola|buenos|saludos|hi|hello/i.test(message)) {
    return KNOWLEDGE_BASE.greetings.welcome;
  }
  
  if (/gracias|adios|chao|bye/i.test(message)) {
    return KNOWLEDGE_BASE.greetings.goodbye;
  }
  
  if (/equipo|miembros|joel|jorge|eva/i.test(message)) {
    let response = KNOWLEDGE_BASE.team.intro + "\n\n";
    response += `• ${KNOWLEDGE_BASE.team.members.joel.name}\n   ${KNOWLEDGE_BASE.team.members.joel.bio}\n   *Habilidades*: ${KNOWLEDGE_BASE.team.members.joel.skills}\n\n`;
    response += `• ${KNOWLEDGE_BASE.team.members.jorge.name}\n   ${KNOWLEDGE_BASE.team.members.jorge.bio}\n   *Habilidades*: ${KNOWLEDGE_BASE.team.members.jorge.skills}\n\n`;
    response += `• ${KNOWLEDGE_BASE.team.members.eva.name}\n   ${KNOWLEDGE_BASE.team.members.eva.bio}\n   *Habilidades*: ${KNOWLEDGE_BASE.team.members.eva.skills}`;
    return response;
  }
  
  if (/proyecto|trabajo|portfolio|sistema|app/i.test(message)) {
    // Si pregunta por un proyecto específico
    for (const [projectName, details] of Object.entries(KNOWLEDGE_BASE.projects.list)) {
      if (message.includes(projectName) || message.includes(details.year)) {
        return `${details.description}\n\n${details.challenge}\n\n${details.solution}\n\n${details.technologies}\n\n${details.impact}`;
      }
    }
    // Si es una pregunta general
    return KNOWLEDGE_BASE.projects.intro + "\n\n" + 
      Object.entries(KNOWLEDGE_BASE.projects.list).map(
        ([name, data]) => `• **${data.description.split(':')[0]}** (${data.year})`
      ).join("\n");
  }
  
  if (/experiencia|años|mercado|historia/i.test(message)) {
    return `${KNOWLEDGE_BASE.experience.years}\n\n${KNOWLEDGE_BASE.experience.stats}\n\n${KNOWLEDGE_BASE.experience.approach}`;
  }
  
  if (/contacto|email|teléfono|whatsapp|dirección/i.test(message)) {
    return `${KNOWLEDGE_BASE.contact.options}\n\n${KNOWLEDGE_BASE.contact.details.email}\n${KNOWLEDGE_BASE.contact.details.whatsapp}\n${KNOWLEDGE_BASE.contact.details.address}\n\n${KNOWLEDGE_BASE.contact.availability}`;
  }
  
  return "🤔 No estoy seguro de lo que preguntas. ¿Podrías reformular? Puedo ayudarte con:\n\n• Información sobre nuestro equipo\n• Detalles de proyectos específicos\n• Nuestra experiencia\n• Cómo contactarnos";
}

wss.on('connection', (ws) => {
  console.log('Nueva conexión WebSocket');
  
  rabbitChannel.consume('chatbot_queue', (msg) => {
    if (msg) {
      const response = generateResponse(msg.content.toString());
      ws.send(response);
      rabbitChannel.ack(msg);
    }
  });

  ws.on('message', (message) => {
    console.log('Mensaje recibido:', message.toString());
    rabbitChannel.sendToQueue(
      'chatbot_queue',
      Buffer.from(message.toString()),
      { persistent: true }
    );
  });
});

const server = app.listen(PORT, async () => {
  await setupRabbitMQ();
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});