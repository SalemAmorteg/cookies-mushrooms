# Cookies & Mushrooms 🍪🍄
> **La Bitácora Interactiva de Parejas.**

---

## 1. Presentación de la Aplicación
**Cookies & Mushrooms** es una plataforma web interactiva diseñada exclusivamente para parejas, concebida como un espacio digital privado para inmortalizar el pasado y planificar el futuro. Rompiendo con los esquemas de diseño tradicionales y corporativos, la aplicación adopta una estética **Neo-Brutalista** radical: bordes negros gruesos (`3px solid #000`), tipografías de alto impacto (`Bebas Neue` y `Space Mono`), colores planos de alto contraste (`#FDE047`, `#0a0a0a`) y una disposición visual asimétrica que convierte la navegación en una experiencia táctil y memorable.

## 2. Descripción
Técnicamente, la aplicación es una Single Page Application (SPA) construida sobre **React** y **Vite**, respaldada por un backend inmutable y asíncrono proveído por **Supabase** (PostgreSQL) y desplegada en **Vercel**. El núcleo de la aplicación gira en torno a dos conceptos fundamentales:
* **Cookies (Recuerdos):** Eventos, citas y anécdotas memorables que ya han ocurrido.
* **Mushrooms (Planes Futuros):** Ideas, proyecciones y citas agendadas que la pareja desea realizar.

La aplicación procesa estos elementos en un único flujo de datos asíncrono, renderizándolos dinámicamente según su categoría, tipo y fecha.

## 3. Utilidad
En las relaciones modernas, los recuerdos compartidos y los planes a futuro suelen dispersarse en chats de mensajería instantánea, galerías de fotos desorganizadas o notas efímeras en el celular. **Cookies & Mushrooms** centraliza el ecosistema de la pareja en un único muro de control. Su utilidad radica en proveer un "cuartel general" emocional donde ambos integrantes pueden auditar su tiempo juntos, inspirarse con ideas aleatorias y garantizar que ningún plan quede en el olvido.

## 4. Funcionalidades Clave

* **Gestión Integral del Ciclo de Vida (CRUD Asíncrono):**
    * **Creación:** Registro de nuevas actividades categorizadas, asociando metadata emocional como sentimientos, momentos destacados (*highlights*) y emojis representativos.
    * **Lectura Dinámica:** Visualización segregada a través de dos tableros principales: "Muro" (Recuerdos/Cookies) y "Próximos" (Planes Futuros/Mushrooms).
    * **Edición y Modificación:** Capacidad de alterar cualquier campo en caliente mediante un componente modular (`EditModal`).
    * **Eliminación Controlada:** Flujo seguro de borrado con confirmación obligatoria en dos pasos (`DeleteModal`) para evitar la pérdida accidental de memorias.
* **Transición Inteligente de Tiempo:** El motor de la app evalúa la `fecha_raw` de los planes futuros contra la fecha actual del sistema. Si la fecha de un "Mushroom" expira, la aplicación automatiza su migración transformándolo inmediatamente en una "Cookie" (Recuerdo), solicitando los detalles del día vivido.
* **Motor de Desafíos Aleatorios ("¡SORPRÉNDEME!"):** Un generador algorítmico integrado que inyecta dinamismo a la relación sugiriendo retos, citas y planes espontáneos basados en las categorías del sistema. Al aceptar un reto, la app pre-completa el formulario de registro automáticamente.
* **Filtrado Multicapa por Categorías:** Clasificación instantánea en el DOM para aislar actividades según su naturaleza: *Cultura, Gastronomía, Aventura, Relax, En Casa y Fecha Especial*.

## 5. Beneficios de la Aplicación

* **Evolución de la Bitácora Física (Portabilidad Absoluta):** Tradicionalmente, las parejas recurren a cuadernos de recortes o bitácoras físicas para guardar sus memorias. Aunque tienen valor sentimental, sufren de desgaste material, riesgo de pérdida y nula portabilidad. **Cookies & Mushrooms** simula la mística de coleccionar recuerdos en un diario, pero resuelve el problema de portabilidad: está disponible 24/7 en cualquier dispositivo móvil o de escritorio a través de la nube.
* **Cálculo Automatizado del Tiempo (`diasRestantes`):** A diferencia de un soporte analógico, la app computa en tiempo real los días faltantes para los próximos eventos y ordena cronológicamente el muro de forma automática, aliviando la carga cognitiva.
* **Aislamiento de Datos y Privacidad:** Al operar con clientes asíncronos directamente hacia instancias seguras de Supabase, la información se mantiene íntegra, centralizada y libre de la minería de datos de las redes sociales convencionales.
* **Identidad Visual Disruptiva:** El diseño Neo-Brutalista no solo es estético; elimina las distracciones de la interfaz de usuario convencional, enfocando la atención de la pareja estrictamente en el contenido de su historia.

## 6. Stack Tecnológico & Arquitectura

* **Frontend:** React 18+ / Vite (Arquitectura basada en estado reactivo centralizado e inyección de estilos *inline* protegidos).
* **Backend as a Service (BaaS):** Supabase Client (Persistencia de datos, autenticación latente y pasarela PostgreSQL).
* **Deployment & CI/CD:** Vercel (Automatización de compilados basados en ramas de Git).
* **Testing Suite:** Playwright (Pruebas End-to-End con interceptación de red y simulación de reloj del navegador).

## 7. Estructura de la Base de Datos (Mapeo de Entidades)

Las transacciones respetan de forma estricta las convenciones de nomenclatura entre el almacenamiento relacional (*snake_case*) y el estado en memoria de React (*camelCase*):

| Columna (Supabase) | Tipo de Dato | Propósito |
| :--- | :--- | :--- |
| `id` | int8 (PK) | Identificador único autoincrementable. |
| `fecha_raw` | text | Fecha del evento almacenada de forma estricta como `YYYY-MM-DD`. |
| `plan` | text | Título descriptivo de la actividad o memoria. |
| `categoria` | text | Tag de clasificación restringido (*Cultura, Gastronomía, etc.*). |
| `highlight` | text | El momento cumbre o las expectativas principales del evento. |
| `sentimiento` | text | Registro del impacto o sentir emocional. |
| `emoji` | text | Un único carácter Unicode representativo. |
| `tipo` | text | Discriminador lógico estricto: `'recuerdo'` o `'futuro'`. |

## 8. Historial de Versiones y Roadmap

### Versión 1.0.0 (Producción Activa)
* Arquitectura base del componente `App.jsx` estabilizada.
* Conexión directa a base de datos de producción mediante cliente estático de Supabase.
* Maquetación e implementación completa de la interfaz Neo-Brutalista.
* Módulo "¡SORPRÉNDEME!" operativo con retos estáticos integrados.

### Versión 2.0.0 (En Desarrollo - Entorno de Staging)
* **Refactorización de Infraestructura:** Migración del cliente de Supabase hacia variables de entorno dinámicas (`import.meta.env`) aisladas por entornos en Vercel (*Production / Preview*).
* **Flujo de Trabajo Profesional:** Implementación de la rama `staging` en Git con despliegues automatizados para control de calidad (QA).
* **Calidad de Software:** Incorporación del framework de automatización Playwright para inmunizar el core del CRUD ante regresiones de código.
* **Próximos features en discusión:** (A definir por el equipo de ingeniería).