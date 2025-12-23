/* =====================================================
   Gestionnaire de Checklists AeroSim
   Application pour gérer des checklists d'avions Flight Simulator
   ===================================================== */

// =====================================================
// Classe principale pour la gestion des checklists
// =====================================================
class ChecklistManager {
    constructor() {
        // Initialisation des données
        this.checklists = [];
        this.currentEditId = null;
        
        // Chargement des données depuis localStorage
        this.loadFromStorage();
        
        // Initialisation des écouteurs d'événements
        this.initializeEventListeners();
        
        // Chargement du mode sombre depuis les préférences
        this.loadDarkModePreference();
        
        // Affichage initial
        this.render();
    }
    
    // =====================================================
    // Initialisation des écouteurs d'événements
    // =====================================================
    initializeEventListeners() {
        // Bouton nouvelle checklist
        document.getElementById('newChecklistBtn').addEventListener('click', () => {
            this.openModal();
        });
        
        // Boutons du modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Clic en dehors du modal pour le fermer
        document.getElementById('checklistModal').addEventListener('click', (e) => {
            if (e.target.id === 'checklistModal') {
                this.closeModal();
            }
        });
        
        // Formulaire de checklist
        document.getElementById('checklistForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveChecklist();
        });
        
        // Bouton ajouter une étape
        document.getElementById('addStepBtn').addEventListener('click', () => {
            this.addStepInput();
        });
        
        // Mode sombre
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        // Import/Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportChecklists();
        });
        
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importChecklists(e);
        });
        
        // Filtre par avion
        document.getElementById('aircraftFilter').addEventListener('change', (e) => {
            this.filterByAircraft(e.target.value);
        });
    }
    
    // =====================================================
    // Gestion du localStorage
    // =====================================================
    loadFromStorage() {
        const stored = localStorage.getItem('aeroSimChecklists');
        if (stored) {
            try {
                this.checklists = JSON.parse(stored);
            } catch (e) {
                console.error('Erreur lors du chargement des données:', e);
                this.checklists = [];
            }
        }
    }
    
    saveToStorage() {
        localStorage.setItem('aeroSimChecklists', JSON.stringify(this.checklists));
    }
    
    // =====================================================
    // Gestion du mode sombre
    // =====================================================
    loadDarkModePreference() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('darkModeToggle').textContent = '☀️';
        }
    }
    
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
    }
    
    // =====================================================
    // Gestion du modal
    // =====================================================
    openModal(checklistId = null) {
        const modal = document.getElementById('checklistModal');
        const modalTitle = document.getElementById('modalTitle');
        
        // Réinitialiser le formulaire
        document.getElementById('checklistForm').reset();
        document.getElementById('stepsList').innerHTML = '';
        
        if (checklistId !== null) {
            // Mode édition
            this.currentEditId = checklistId;
            const checklist = this.checklists.find(c => c.id === checklistId);
            
            modalTitle.textContent = 'Modifier la checklist';
            document.getElementById('checklistName').value = checklist.name;
            document.getElementById('aircraftType').value = checklist.aircraft || '';
            
            // Ajouter les étapes existantes
            checklist.steps.forEach(step => {
                this.addStepInput(step.text);
            });
        } else {
            // Mode création
            this.currentEditId = null;
            modalTitle.textContent = 'Nouvelle Checklist';
            
            // Ajouter une première étape vide
            this.addStepInput();
        }
        
        modal.classList.add('active');
    }
    
    closeModal() {
        document.getElementById('checklistModal').classList.remove('active');
        this.currentEditId = null;
    }
    
    // =====================================================
    // Gestion des étapes dans le formulaire
    // =====================================================
    addStepInput(text = '') {
        const stepsList = document.getElementById('stepsList');
        const stepGroup = document.createElement('div');
        stepGroup.className = 'step-input-group';
        
        stepGroup.innerHTML = `
            <input type="text" class="input-field step-input" placeholder="Étape de la checklist" value="${this.escapeHtml(text)}">
            <button type="button" class="btn btn-danger btn-small remove-step-btn">🗑️</button>
        `;
        
        // Ajouter l'écouteur pour le bouton de suppression
        stepGroup.querySelector('.remove-step-btn').addEventListener('click', () => {
            stepGroup.remove();
        });
        
        stepsList.appendChild(stepGroup);
    }
    
    // =====================================================
    // Sauvegarde d'une checklist
    // =====================================================
    saveChecklist() {
        const name = document.getElementById('checklistName').value.trim();
        const aircraft = document.getElementById('aircraftType').value.trim();
        
        // Récupérer toutes les étapes
        const stepInputs = document.querySelectorAll('.step-input');
        const baseTimestamp = Date.now();
        const steps = Array.from(stepInputs)
            .map(input => input.value.trim())
            .filter(text => text !== '')
            .map((text, index) => ({
                id: baseTimestamp + index * 1000 + Math.floor(Math.random() * 1000),
                text: text,
                completed: false
            }));
        
        if (name === '' || steps.length === 0) {
            alert('Veuillez remplir le nom et ajouter au moins une étape');
            return;
        }
        
        if (this.currentEditId !== null) {
            // Mise à jour d'une checklist existante
            const index = this.checklists.findIndex(c => c.id === this.currentEditId);
            if (index !== -1) {
                // Garder l'état de complétion des anciennes étapes si possible
                const oldSteps = this.checklists[index].steps;
                steps.forEach(step => {
                    const oldStep = oldSteps.find(s => s.text === step.text);
                    if (oldStep) {
                        step.completed = oldStep.completed;
                    }
                });
                
                this.checklists[index] = {
                    ...this.checklists[index],
                    name: name,
                    aircraft: aircraft,
                    steps: steps
                };
            }
        } else {
            // Création d'une nouvelle checklist
            const newChecklist = {
                id: Date.now(),
                name: name,
                aircraft: aircraft,
                steps: steps,
                createdAt: new Date().toISOString()
            };
            
            this.checklists.push(newChecklist);
        }
        
        // Sauvegarder et fermer
        this.saveToStorage();
        this.closeModal();
        this.render();
    }
    
    // =====================================================
    // Suppression d'une checklist
    // =====================================================
    deleteChecklist(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette checklist ?')) {
            this.checklists = this.checklists.filter(c => c.id !== id);
            this.saveToStorage();
            this.render();
        }
    }
    
    // =====================================================
    // Gestion des étapes (cocher/décocher)
    // =====================================================
    toggleStep(checklistId, stepId) {
        const checklist = this.checklists.find(c => c.id === checklistId);
        if (checklist) {
            const step = checklist.steps.find(s => s.id === stepId);
            if (step) {
                step.completed = !step.completed;
                this.saveToStorage();
                this.render();
            }
        }
    }
    
    // =====================================================
    // Réinitialiser toutes les cases à cocher
    // =====================================================
    resetChecklist(id) {
        const checklist = this.checklists.find(c => c.id === id);
        if (checklist) {
            checklist.steps.forEach(step => {
                step.completed = false;
            });
            this.saveToStorage();
            this.render();
        }
    }
    
    // =====================================================
    // Import/Export JSON
    // =====================================================
    exportChecklists() {
        const dataStr = JSON.stringify(this.checklists, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `aerosim-checklists-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    importChecklists(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                if (!Array.isArray(imported)) {
                    alert('Format de fichier invalide');
                    return;
                }
                
                // Fusionner avec les checklists existantes
                if (confirm(`Importer ${imported.length} checklist(s) ? Cela s'ajoutera aux checklists existantes.`)) {
                    // Réattribuer des IDs pour éviter les conflits
                    let baseTime = Date.now();
                    imported.forEach((checklist, checklistIndex) => {
                        checklist.id = baseTime + checklistIndex * 10000 + Math.floor(Math.random() * 1000);
                        checklist.steps.forEach((step, stepIndex) => {
                            step.id = baseTime + checklistIndex * 10000 + stepIndex * 100 + Math.floor(Math.random() * 100);
                        });
                    });
                    
                    this.checklists = [...this.checklists, ...imported];
                    this.saveToStorage();
                    this.render();
                }
            } catch (error) {
                alert('Erreur lors de l\'import du fichier');
                console.error(error);
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Réinitialiser l'input
    }
    
    // =====================================================
    // Filtrage par avion
    // =====================================================
    filterByAircraft(aircraft) {
        this.render(aircraft);
    }
    
    // =====================================================
    // Affichage des checklists
    // =====================================================
    render(filterAircraft = '') {
        const container = document.getElementById('checklistsList');
        const emptyState = document.getElementById('emptyState');
        
        // Filtrer les checklists
        let displayChecklists = this.checklists;
        if (filterAircraft) {
            displayChecklists = this.checklists.filter(c => c.aircraft === filterAircraft);
        }
        
        // Mettre à jour le filtre d'avions
        this.updateAircraftFilter();
        
        // Afficher l'état vide si nécessaire
        if (this.checklists.length === 0) {
            emptyState.classList.remove('hidden');
            container.innerHTML = '';
            return;
        } else {
            emptyState.classList.add('hidden');
        }
        
        // Afficher message si aucun résultat après filtrage
        if (displayChecklists.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Aucune checklist trouvée pour cet avion.</p>';
            return;
        }
        
        // Générer le HTML pour chaque checklist
        container.innerHTML = displayChecklists.map(checklist => {
            const completedCount = checklist.steps.filter(s => s.completed).length;
            const totalCount = checklist.steps.length;
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            return `
                <div class="checklist-card" data-id="${checklist.id}">
                    <div class="checklist-header">
                        <div class="checklist-title">
                            <h3>${this.escapeHtml(checklist.name)}</h3>
                            ${checklist.aircraft ? `<span class="aircraft-badge">${this.escapeHtml(checklist.aircraft)}</span>` : ''}
                        </div>
                        <div class="checklist-actions">
                            <button class="btn-icon edit-btn" title="Modifier" data-id="${checklist.id}">✏️</button>
                            <button class="btn-icon delete-btn" title="Supprimer" data-id="${checklist.id}">🗑️</button>
                        </div>
                    </div>
                    
                    <div class="checklist-steps">
                        ${checklist.steps.map(step => `
                            <div class="step-item ${step.completed ? 'completed' : ''}">
                                <input 
                                    type="checkbox" 
                                    ${step.completed ? 'checked' : ''} 
                                    data-checklist-id="${checklist.id}"
                                    data-step-id="${step.id}"
                                    class="step-checkbox"
                                >
                                <label>${this.escapeHtml(step.text)}</label>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="checklist-footer">
                        <div class="progress-info">
                            ${completedCount}/${totalCount} complétées (${progress}%)
                        </div>
                        <button class="btn btn-secondary btn-small reset-btn" data-id="${checklist.id}">
                            🔄 Réinitialiser
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Ajouter les écouteurs d'événements
        this.attachChecklistEventListeners();
    }
    
    // =====================================================
    // Mettre à jour le filtre des avions
    // =====================================================
    updateAircraftFilter() {
        const select = document.getElementById('aircraftFilter');
        const currentValue = select.value;
        
        // Récupérer tous les types d'avions uniques
        const aircrafts = [...new Set(this.checklists
            .map(c => c.aircraft)
            .filter(a => a && a.trim() !== ''))];
        
        // Générer les options
        select.innerHTML = '<option value="">Tous les avions</option>' +
            aircrafts.map(aircraft => 
                `<option value="${this.escapeHtml(aircraft)}">${this.escapeHtml(aircraft)}</option>`
            ).join('');
        
        // Restaurer la valeur sélectionnée
        select.value = currentValue;
    }
    
    // =====================================================
    // Attacher les écouteurs aux éléments de la liste
    // =====================================================
    attachChecklistEventListeners() {
        // Boutons éditer
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.openModal(id);
            });
        });
        
        // Boutons supprimer
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.deleteChecklist(id);
            });
        });
        
        // Boutons réinitialiser
        document.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.resetChecklist(id);
            });
        });
        
        // Cases à cocher
        document.querySelectorAll('.step-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const checklistId = parseInt(e.target.dataset.checklistId);
                const stepId = parseInt(e.target.dataset.stepId);
                this.toggleStep(checklistId, stepId);
            });
        });
    }
    
    // =====================================================
    // Utilitaire pour échapper le HTML
    // =====================================================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// =====================================================
// Initialisation de l'application
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    new ChecklistManager();
});
