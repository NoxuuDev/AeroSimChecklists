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
        
        // Bouton ajouter une checklist
        document.getElementById('addChecklistBtn').addEventListener('click', () => {
            this.addChecklistSection();
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
        document.getElementById('checklistsFormList').innerHTML = '';
        
        if (checklistId !== null) {
            // Mode édition
            this.currentEditId = checklistId;
            const checklist = this.checklists.find(c => c.id === checklistId);
            
            modalTitle.textContent = 'Modifier la checklist';
            document.getElementById('checklistTitle').value = checklist.title;
            document.getElementById('aircraftType').value = checklist.aircraft || '';
            
            // Ajouter les sous-checklists existantes
            checklist.checklists.forEach(subChecklist => {
                this.addChecklistSection(subChecklist);
            });
        } else {
            // Mode création
            this.currentEditId = null;
            modalTitle.textContent = 'Nouvelle Checklist';
            
            // Ajouter une première sous-checklist vide
            this.addChecklistSection();
        }
        
        modal.classList.add('active');
    }
    
    closeModal() {
        document.getElementById('checklistModal').classList.remove('active');
        this.currentEditId = null;
    }
    
    // =====================================================
    // Gestion des checklists dans le formulaire
    // =====================================================
    addChecklistSection(checklistData = null) {
        const checklistsList = document.getElementById('checklistsFormList');
        const checklistSection = document.createElement('div');
        checklistSection.className = 'checklist-section';
        
        const checklistId = checklistData?.id || Date.now() + Math.random();
        
        checklistSection.innerHTML = `
            <div class="checklist-section-header">
                <input type="text" class="input-field checklist-name-input" placeholder="Nom de la checklist (ex: Preflight)" value="${this.escapeHtml(checklistData?.name || '')}">
                <button type="button" class="btn btn-danger btn-small remove-checklist-btn">🗑️</button>
            </div>
            <div class="items-list" data-checklist-id="${checklistId}">
                <!-- Items will be added here -->
            </div>
            <button type="button" class="btn btn-secondary btn-small add-item-btn" data-checklist-id="${checklistId}">
                ➕ Ajouter un item
            </button>
        `;
        
        // Add event listener for remove checklist button
        checklistSection.querySelector('.remove-checklist-btn').addEventListener('click', () => {
            checklistSection.remove();
        });
        
        // Add event listener for add item button
        checklistSection.querySelector('.add-item-btn').addEventListener('click', (e) => {
            const checklistId = e.target.dataset.checklistId;
            this.addItemInput(checklistId);
        });
        
        checklistsList.appendChild(checklistSection);
        
        // Add existing items if any
        if (checklistData?.items) {
            checklistData.items.forEach(item => {
                this.addItemInput(checklistId, item);
            });
        }
    }
    
    addItemInput(checklistId, itemData = null) {
        const itemsList = document.querySelector(`.items-list[data-checklist-id="${checklistId}"]`);
        const itemGroup = document.createElement('div');
        itemGroup.className = 'item-input-group';
        
        itemGroup.innerHTML = `
            <div class="item-row">
                <input type="text" class="input-field item-name-input" placeholder="Nom de l'item (ex: BATT 1+2)" value="${this.escapeHtml(itemData?.name || '')}">
                <input type="text" class="input-field item-action-input" placeholder="Action (ex: ON)" value="${this.escapeHtml(itemData?.action || '')}">
                <button type="button" class="btn btn-danger btn-small remove-item-btn">🗑️</button>
            </div>
            <input type="text" class="input-field item-comment-input" placeholder="Commentaire (optionnel)" value="${this.escapeHtml(itemData?.comment || '')}">
        `;
        
        // Add event listener for remove item button
        itemGroup.querySelector('.remove-item-btn').addEventListener('click', () => {
            itemGroup.remove();
        });
        
        itemsList.appendChild(itemGroup);
    }
    
    // =====================================================
    // Sauvegarde d'une checklist
    // =====================================================
    saveChecklist() {
        const title = document.getElementById('checklistTitle').value.trim();
        const aircraft = document.getElementById('aircraftType').value.trim();
        
        // Récupérer toutes les sous-checklists
        const checklistSections = document.querySelectorAll('.checklist-section');
        const checklists = [];
        const baseTimestamp = Date.now();
        
        checklistSections.forEach((section, checklistIndex) => {
            const checklistNameInput = section.querySelector('.checklist-name-input');
            const checklistName = checklistNameInput.value.trim();
            
            if (checklistName === '') return;
            
            // Récupérer tous les items de cette sous-checklist
            const itemGroups = section.querySelectorAll('.item-input-group');
            const items = [];
            
            itemGroups.forEach((group, itemIndex) => {
                const name = group.querySelector('.item-name-input').value.trim();
                const action = group.querySelector('.item-action-input').value.trim();
                const comment = group.querySelector('.item-comment-input').value.trim();
                
                if (name !== '') {
                    items.push({
                        id: baseTimestamp + checklistIndex * 100000 + itemIndex * 1000 + Math.floor(Math.random() * 1000),
                        name: name,
                        action: action,
                        comment: comment,
                        completed: false
                    });
                }
            });
            
            if (items.length > 0) {
                checklists.push({
                    id: baseTimestamp + checklistIndex * 100000 + Math.floor(Math.random() * 1000),
                    name: checklistName,
                    items: items
                });
            }
        });
        
        if (title === '' || checklists.length === 0) {
            alert('Veuillez remplir le titre et ajouter au moins une checklist avec des items');
            return;
        }
        
        if (this.currentEditId !== null) {
            // Mise à jour d'une checklist existante
            const index = this.checklists.findIndex(c => c.id === this.currentEditId);
            if (index !== -1) {
                // Garder l'état de complétion des anciens items si possible
                const oldChecklists = this.checklists[index].checklists;
                checklists.forEach(checklist => {
                    const oldChecklist = oldChecklists.find(c => c.name === checklist.name);
                    if (oldChecklist) {
                        checklist.items.forEach(item => {
                            const oldItem = oldChecklist.items.find(i => i.name === item.name && i.action === item.action);
                            if (oldItem) {
                                item.completed = oldItem.completed;
                            }
                        });
                    }
                });
                
                this.checklists[index] = {
                    ...this.checklists[index],
                    title: title,
                    aircraft: aircraft,
                    checklists: checklists
                };
            }
        } else {
            // Création d'une nouvelle checklist
            const newChecklist = {
                id: Date.now(),
                title: title,
                aircraft: aircraft,
                checklists: checklists,
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
    // Gestion des items (cocher/décocher)
    // =====================================================
    toggleItem(checklistId, subChecklistId, itemId) {
        const checklist = this.checklists.find(c => c.id === checklistId);
        if (checklist) {
            const subChecklist = checklist.checklists.find(sc => sc.id === subChecklistId);
            if (subChecklist) {
                const item = subChecklist.items.find(i => i.id === itemId);
                if (item) {
                    item.completed = !item.completed;
                    this.saveToStorage();
                    this.render();
                }
            }
        }
    }
    
    // =====================================================
    // Réinitialiser toutes les cases à cocher
    // =====================================================
    resetChecklist(id) {
        const checklist = this.checklists.find(c => c.id === id);
        if (checklist) {
            checklist.checklists.forEach(subChecklist => {
                subChecklist.items.forEach(item => {
                    item.completed = false;
                });
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
            // Calculate total completed items across all sub-checklists
            let completedCount = 0;
            let totalCount = 0;
            checklist.checklists.forEach(subChecklist => {
                subChecklist.items.forEach(item => {
                    totalCount++;
                    if (item.completed) completedCount++;
                });
            });
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            return `
                <div class="checklist-card" data-id="${checklist.id}">
                    <div class="checklist-header">
                        <div class="checklist-title">
                            <h3>${this.escapeHtml(checklist.title)}</h3>
                            ${checklist.aircraft ? `<span class="aircraft-badge">${this.escapeHtml(checklist.aircraft)}</span>` : ''}
                        </div>
                        <div class="checklist-actions">
                            <button class="btn-icon edit-btn" title="Modifier" data-id="${checklist.id}">✏️</button>
                            <button class="btn-icon delete-btn" title="Supprimer" data-id="${checklist.id}">🗑️</button>
                        </div>
                    </div>
                    
                    <div class="checklist-sections">
                        ${checklist.checklists.map(subChecklist => `
                            <div class="sub-checklist">
                                <h4 class="sub-checklist-title">${this.escapeHtml(subChecklist.name)}</h4>
                                <div class="checklist-items">
                                    ${subChecklist.items.map(item => `
                                        <div class="item-row ${item.completed ? 'completed' : ''}">
                                            <div class="item-main">
                                                <input 
                                                    type="checkbox" 
                                                    ${item.completed ? 'checked' : ''} 
                                                    data-checklist-id="${checklist.id}"
                                                    data-subchecklist-id="${subChecklist.id}"
                                                    data-item-id="${item.id}"
                                                    class="item-checkbox"
                                                >
                                                <div class="item-content">
                                                    <div class="item-name-action">
                                                        <span class="item-name">${this.escapeHtml(item.name)}</span>
                                                        ${item.action ? `<span class="item-action">${this.escapeHtml(item.action)}</span>` : ''}
                                                    </div>
                                                    ${item.comment ? `<div class="item-comment">${this.escapeHtml(item.comment)}</div>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
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
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const checklistId = parseInt(e.target.dataset.checklistId);
                const subChecklistId = parseInt(e.target.dataset.subchecklistId);
                const itemId = parseInt(e.target.dataset.itemId);
                this.toggleItem(checklistId, subChecklistId, itemId);
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
