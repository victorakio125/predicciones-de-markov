let secuencia = [];
const estados = ["Soleado", "Nublado", "Lluvioso"];
const iconos = { "Soleado": "☀️", "Nublado": "☁️", "Lluvioso": "🌧️" };
const colores = { "Soleado": "#f39c12", "Nublado": "#7f8c8d", "Lluvioso": "#3498db" };
// Coordenadas en forma de triángulo para que sea más claro visualmente
const coords = { "Soleado": { x: 300, y: 80 }, "Nublado": { x: 150, y: 250 }, "Lluvioso": { x: 450, y: 250 } };

// --- NAVEGACIÓN ENTRE PANTALLAS ---
function irAPantalla(num) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${num}`).classList.add('active');

    if (num === 3) {
        const matriz = calcularMatriz();
        dibujarDigrafo(matriz);
    }
    if (num === 4) {
        const matriz = calcularMatriz();
        renderizarMatriz(matriz);
        mostrarPrediccion(matriz, secuencia[secuencia.length - 1]);
    }
}

// --- LÓGICA DE CLIMA ---
function agregarClima(tipo) {
    secuencia.push(tipo);
    actualizarVistaHistorial();
    
    // Habilitar botón de continuar si hay 2 o más datos
    if (secuencia.length >= 2) {
        document.getElementById("btn-next-2").disabled = false;
        document.getElementById("btn-next-2").innerHTML = 'Ver Mapa Mental <i class="fa-solid fa-arrow-right"></i>';
    }
}

function calcularMatriz() {
    let conteo = {};
    estados.forEach(e1 => {
        conteo[e1] = {};
        estados.forEach(e2 => conteo[e1][e2] = 0);
    });

    for (let i = 0; i < secuencia.length - 1; i++) {
        conteo[secuencia[i]][secuencia[i+1]]++;
    }

    let matrizProb = {};
    estados.forEach(e1 => {
        let total = Object.values(conteo[e1]).reduce((a, b) => a + b, 0);
        matrizProb[e1] = {};
        estados.forEach(e2 => {
            matrizProb[e1][e2] = total > 0 ? (conteo[e1][e2] / total) : 0;
        });
    });
    return matrizProb;
}

// --- DÍGRAFO MEJORADO CON TEXTOS ---
function dibujarDigrafo(matriz) {
    const svg = d3.select("#svg-grafo");
    svg.selectAll("*").remove();
    const g = svg.append("g");

    const zoom = d3.zoom().on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);

    // Definir la punta de la flecha
    g.append("defs").append("marker")
        .attr("id", "arrow").attr("viewBox", "0 0 10 10").attr("refX", "28").attr("refY", "5")
        .attr("markerWidth", "6").attr("markerHeight", "6").attr("orient", "auto")
        .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "#95a5a6");

    // Dibujar líneas y textos
    estados.forEach(origen => {
        estados.forEach(destino => {
            const prob = matriz[origen][destino];
            if (prob > 0) {
                const s = coords[origen], e = coords[destino];
                let pathStr, midX, midY;
                
                if (origen === destino) {
                    // Bucle hacia sí mismo
                    pathStr = `M ${s.x-10} ${s.y-30} A 30 30 0 1 1 ${s.x+10} ${s.y-30}`;
                    midX = s.x; midY = s.y - 65;
                } else {
                    // Curva hacia otro nodo
                    midX = (s.x + e.x) / 2 + (e.y - s.y) * 0.15;
                    midY = (s.y + e.y) / 2 + (s.x - e.x) * 0.15;
                    pathStr = `M ${s.x} ${s.y} Q ${midX} ${midY} ${e.x} ${e.y}`;
                }

                // Dibujar línea
                g.append("path").attr("d", pathStr).attr("class", "edge")
                 .attr("fill", "none")
                 .attr("stroke", colores[destino])
                 .attr("stroke-width", 2 + prob * 4)
                 .attr("marker-end", "url(#arrow)")
                 .style("opacity", 0.6);

                // Dibujar el porcentaje sobre la línea
                g.append("text")
                 .attr("x", midX).attr("y", midY)
                 .attr("text-anchor", "middle")
                 .attr("dy", -5)
                 .style("font-size", "14px").style("font-weight", "bold").style("fill", "#2c3e50")
                 .style("background", "white")
                 .text(`${(prob * 100).toFixed(0)}%`);
            }
        });
    });

    // Dibujar Círculos de los climas
    estados.forEach(est => {
        const { x, y } = coords[est];
        const n = g.append("g");
        
        n.append("circle")
         .attr("cx", x).attr("cy", y).attr("r", 35)
         .attr("fill", "white")
         .style("stroke", colores[est])
         .style("stroke-width", est === secuencia[secuencia.length-1] ? "4px" : "2px")
         .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
         
        n.append("text")
         .attr("x", x).attr("y", y+10)
         .attr("text-anchor", "middle")
         .style("font-size", "28px")
         .text(iconos[est]);
    });
}

// --- TABLAS Y RESULTADOS ---
function actualizarVistaHistorial() { 
    const contenedor = document.getElementById("historial-iconos");
    const mostrar = secuencia.slice(-20); // Mostrar máximo 20 para no romper UI
    contenedor.innerHTML = mostrar.map(s => `<span>${iconos[s]}</span>`).join(" "); 
}

function mostrarPrediccion(matriz, ultimo) {
    document.getElementById("texto-hoy").innerHTML = `Como hoy estuvo <strong>${iconos[ultimo]} ${ultimo}</strong>, la app calcula que mañana será:`;
    
    const probs = matriz[ultimo];
    let maxP = -1, ganador = "";
    
    let html = estados.map(est => {
        const porcentaje = Math.round(probs[est] * 100);
        if (probs[est] > maxP) { maxP = probs[est]; ganador = est; }
        
        return `
        <div class="bar-row">
            <div class="bar-header">
                <span>${iconos[est]} ${est}</span>
                <span>${porcentaje}%</span>
            </div>
            <div class="bar-bg">
                <div class="bar-fill" style="width:${porcentaje}%; background:${colores[est]}"></div>
            </div>
        </div>`;
    }).join("");
    
    document.getElementById("prediccion-container").innerHTML = html;
    
    if(maxP > 0) { document.body.className = "bg-" + ganador.toLowerCase(); }
}

function renderizarMatriz(m) {
    const ultimoEstado = secuencia[secuencia.length - 1];
    let html = `<table><tr><th>Hoy \\ Mañana</th><th>☀️</th><th>☁️</th><th>🌧️</th></tr>`;

    estados.forEach(fila => {
        const esActiva = (fila === ultimoEstado);
        html += `<tr class="${esActiva ? 'active-row' : ''}"><th>${iconos[fila]}</th>`;
        estados.forEach(col => {
            const prob = (m[fila][col] * 100).toFixed(0);
            html += `<td style="color: ${prob > 0 ? '#2c3e50' : '#bdc3c7'}">${prob}%</td>`;
        });
        html += "</tr>";
    });
    html += "</table>";
    document.getElementById("matriz-container").innerHTML = html;
}

function reiniciarApp() {
    secuencia = [];
    document.body.className = "";
    document.getElementById("btn-next-2").disabled = true;
    document.getElementById("btn-next-2").innerHTML = 'Faltan datos...';
    document.getElementById("historial-iconos").innerHTML = '<span class="placeholder">Empieza a presionar los botones arriba...</span>';
    irAPantalla(1);
}

// --- LÓGICA DEL MODAL EDUCATIVO ---
function abrirModalExplicacion() {
    generarContenidoExplicacion();
    const modal = document.getElementById('modal-matematica');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10); // Pequeño delay para la animación
}

function cerrarModalExplicacion() {
    const modal = document.getElementById('modal-matematica');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300); // Espera que termine la animación
}

function generarContenidoExplicacion() {
    // 1. Calcular conteos puros
    let conteo = {};
    let salidas = {};
    estados.forEach(e1 => {
        conteo[e1] = {}; salidas[e1] = 0;
        estados.forEach(e2 => conteo[e1][e2] = 0);
    });

    for (let i = 0; i < secuencia.length - 1; i++) {
        conteo[secuencia[i]][secuencia[i+1]]++;
        salidas[secuencia[i]]++; // Cuántas veces salimos de este clima
    }

    // 2. Construir el HTML dinámico
    let html = `
    <div class="explainer-step">
        <h3>Fase 1: El Conteo de Saltos</h3>
        <p>La app revisó tu historial y contó cuántas veces el clima cambió de un estado a otro. El <strong>Total Salidas</strong> es la suma de toda la fila.</p>
        <table style="width:100%; text-align:center; border-collapse: collapse; margin-top: 10px;">
            <tr style="background:#f1f2f6; color:#2c3e50;">
                <th style="padding:10px;">Hoy \\ Mañana</th><th>☀️ Sol</th><th>☁️ Nube</th><th>🌧️ Lluvia</th><th>Total Salidas</th>
            </tr>`;

    estados.forEach(f => {
        html += `<tr><th style="text-align:left; padding:10px;">${iconos[f]} ${f}</th>`;
        estados.forEach(c => html += `<td style="padding:10px; border-bottom:1px solid #eee;">${conteo[f][c]}</td>`);
        html += `<td style="background:#ecf0f1; font-weight:bold; padding:10px;">${salidas[f]}</td></tr>`;
    });
    html += `</table></div>`;

    html += `
    <div class="explainer-step" style="border-left-color: #00b894;">
        <h3 style="color: #00b894;">Fase 2: La Matemática (Porcentajes)</h3>
        <p>Para obtener el porcentaje exacto, aplicamos una regla simple: <strong>(Conteo de la celda ÷ Total de Salidas) × 100</strong>.</p>
        <table style="width:100%; text-align:center; border-collapse: collapse; font-size:0.95rem; margin-top: 10px;">
            <tr style="background:#f1f2f6; color:#2c3e50;">
                <th style="padding:10px;">Hoy \\ Mañana</th><th>☀️ Sol</th><th>☁️ Nube</th><th>🌧️ Lluvia</th>
            </tr>`;
    
    estados.forEach(f => {
        html += `<tr><th style="text-align:left; padding:10px;">${iconos[f]} ${f}</th>`;
        estados.forEach(c => {
            if (salidas[f] > 0) {
                // AQUÍ ESTÁ EL CAMBIO CLAVE: Mostramos la división
                let prob = (conteo[f][c] / salidas[f] * 100).toFixed(0);
                html += `<td style="padding:10px; border-bottom:1px solid #eee;">
                            <span style="color:#7f8c8d; font-size:0.8rem;">(${conteo[f][c]}/${salidas[f]})</span><br>
                            <b style="color:#2c3e50; font-size:1.1rem;">${prob}%</b>
                         </td>`;
            } else {
                html += `<td style="padding:10px; border-bottom:1px solid #eee; color:#bdc3c7;">Sin datos</td>`;
            }
        });
        html += `</tr>`;
    });

    const ultimo = secuencia.length > 0 ? secuencia[secuencia.length-1] : "Ninguno";

    html += `</table>
        <p style="font-size:0.85rem; color:#7f8c8d; margin-top:15px; background:white; padding:10px; border-radius:8px; border: 1px dashed #ccc;">
            <em>*Nota: Las filas que dicen "Sin datos" no suman 100% porque la app necesita que registres qué pasa después de esos días para poder aprender.</em>
        </p>
    </div>
    
    <div class="explainer-step" style="border-left-color: #f39c12; background: #fffde7; margin-bottom:0;">
        <h3 style="color: #f39c12;"><i class="fa-solid fa-bolt"></i> Fase 3: La Predicción</h3>
        <p>El último clima que ingresaste fue <strong>${iconos[ultimo]} ${ultimo}</strong>. Usando la <em>Propiedad de Márkov</em>, la app ignora todo el pasado y <strong>solo usa la fila de ${ultimo}</strong> de la tabla de arriba para dibujar las barras finales.</p>
    </div>`;

    document.getElementById('contenido-explicacion').innerHTML = html;
}
