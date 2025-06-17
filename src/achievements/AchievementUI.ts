import {AchievementId, ACHIEVEMENTS, getAchievementsByCategory} from './AchievementDefinitions';
import {AchievementData, AchievementStats} from './AchievementStorage';

export class AchievementUI {
	private activeNotifications: HTMLElement[] = [];

	initialize(): void {
		this.addStyles();
		this.createModal();
	}

	private addStyles(): void {
		const style = document.createElement('style');
		style.textContent = `
      .achievement-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        overflow-y: auto;
      }

      .achievement-modal-content {
        background-color: #1a1a1a;
        margin: 5% auto;
        padding: 20px;
        border: 2px solid #333;
        width: 90%;
        max-width: 600px;
        border-radius: 10px;
        color: #e0e0e0;
      }

      .achievement-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .achievement-modal-title {
        font-size: 24px;
        font-weight: bold;
        color: #ffeb3b;
      }

      .achievement-close {
        color: #aaa;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
      }

      .achievement-close:hover {
        color: #fff;
      }

      .achievement-stats {
        background-color: #2a2a2a;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 20px;
      }

      .achievement-stats h3 {
        margin-top: 0;
        color: #ffeb3b;
      }

      .achievement-stat {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }

      .achievement-category {
        margin-bottom: 30px;
      }

      .achievement-category h3 {
        color: #ffeb3b;
        margin-bottom: 15px;
      }

      .achievement-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 15px;
      }

      .achievement-item {
        background-color: #2a2a2a;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
        transition: all 0.3s ease;
      }

      .achievement-item.unlocked {
        background-color: #2d4a2b;
        border-color: #4caf50;
      }

      .achievement-item.locked {
        opacity: 0.6;
      }

      .achievement-icon {
        font-size: 36px;
        margin-bottom: 10px;
      }

      .achievement-name {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 14px;
      }

      .achievement-description {
        font-size: 12px;
        color: #aaa;
      }

      .achievement-unlock-date {
        font-size: 10px;
        color: #888;
        margin-top: 5px;
      }

      .achievement-notification {
        position: fixed;
        right: 20px;
        background-color: #2d4a2b;
        border: 2px solid #4caf50;
        border-radius: 10px;
        padding: 20px;
        color: #fff;
        z-index: 10001;
        animation: slideIn 0.5s ease-out;
        max-width: 300px;
        transition: top 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      .achievement-notification.hiding {
        animation: slideOut 0.5s ease-out;
      }

      .achievement-notification-header {
        font-weight: bold;
        margin-bottom: 10px;
        color: #ffeb3b;
      }

      .achievement-notification-content {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .achievement-notification-icon {
        font-size: 36px;
      }
    `;
		document.head.appendChild(style);
	}

	private createModal(): void {
		const modal = document.createElement('div');
		modal.id = 'achievementModal';
		modal.className = 'achievement-modal';
		modal.innerHTML = `
      <div class="achievement-modal-content">
        <div class="achievement-modal-header">
          <h2 class="achievement-modal-title">Achievements</h2>
          <button class="achievement-close" id="achievementClose">&times;</button>
        </div>
        <div id="achievementContent"></div>
      </div>
    `;
		document.body.appendChild(modal);

		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				this.hideModal();
			}
		});

		const closeBtn = document.getElementById('achievementClose');
		if (closeBtn) {
			closeBtn.addEventListener('click', () => this.hideModal());
		}
	}

	showAchievementsModal(achievements: Record<AchievementId, AchievementData>, stats: AchievementStats): void {
		const modal = document.getElementById('achievementModal');
		const content = document.getElementById('achievementContent');
		if (!modal || !content) return;

		const categories = getAchievementsByCategory();

		content.innerHTML = `
      <div class="achievement-stats">
        <h3>Statistics</h3>
        <div class="achievement-stat">
          <span>Games Played:</span>
          <span>${stats.gamesPlayed}</span>
        </div>
        <div class="achievement-stat">
          <span>Games Won:</span>
          <span>${stats.gamesWon}</span>
        </div>
        <div class="achievement-stat">
          <span>Total Moves:</span>
          <span>${stats.totalMoves}</span>
        </div>
        <div class="achievement-stat">
          <span>Win Rate:</span>
          <span>${stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0}%</span>
        </div>
      </div>

      <div class="achievement-category">
        <h3>Completion Achievements</h3>
        <div class="achievement-grid">
          ${this.renderAchievements(categories.completion, achievements)}
        </div>
      </div>

      <div class="achievement-category">
        <h3>Perfect Play Achievements</h3>
        <div class="achievement-grid">
          ${this.renderAchievements(categories.perfection, achievements)}
        </div>
      </div>

      <div class="achievement-category">
        <h3>Sequential Master Achievements</h3>
        <div class="achievement-grid">
          ${this.renderAchievements(categories.inOrder, achievements)}
        </div>
      </div>
    `;

		modal.style.display = 'block';
	}

	private renderAchievements(
		categoryAchievements: (typeof ACHIEVEMENTS)[AchievementId][],
		playerAchievements: Record<AchievementId, AchievementData>,
	): string {
		return categoryAchievements
			.map((achievement) => {
				const data = playerAchievements[achievement.id];
				const unlocked = data?.unlocked || false;
				const unlockedDate = data?.unlockedAt ? new Date(data.unlockedAt).toLocaleDateString() : '';

				return `
        <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${unlocked ? achievement.icon : '🔒'}</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
          ${unlocked ? `<div class="achievement-unlock-date">${unlockedDate}</div>` : ''}
        </div>
      `;
			})
			.join('');
	}

	hideModal(): void {
		const modal = document.getElementById('achievementModal');
		if (modal) {
			modal.style.display = 'none';
		}
	}

	showUnlockNotifications(achievementIds: AchievementId[]): void {
		achievementIds.forEach((id) => {
			this.showUnlockNotification(id);
		});
	}

	private showUnlockNotification(achievementId: AchievementId): void {
		const achievement = ACHIEVEMENTS[achievementId];
		if (!achievement) return;

		const notification = document.createElement('div');
		notification.className = 'achievement-notification';
		notification.innerHTML = `
      <div class="achievement-notification-header">Achievement Unlocked!</div>
      <div class="achievement-notification-content">
        <div class="achievement-notification-icon">${achievement.icon}</div>
        <div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-description">${achievement.description}</div>
        </div>
      </div>
    `;

		// Calculate position based on existing notifications
		// 150px height + 20px gap
		const topOffset = 20 + this.activeNotifications.length * 170;
		notification.style.top = `${topOffset}px`;

		document.body.appendChild(notification);
		this.activeNotifications.push(notification);

		setTimeout(() => {
			notification.classList.add('hiding');
			setTimeout(() => {
				notification.remove();
				// Remove from active notifications and reposition remaining ones
				const index = this.activeNotifications.indexOf(notification);
				if (index > -1) {
					this.activeNotifications.splice(index, 1);
					this.repositionNotifications();
				}
			}, 500);
		}, 4000);
	}

	private repositionNotifications(): void {
		this.activeNotifications.forEach((notification, index) => {
			const topOffset = 20 + index * 170;
			notification.style.top = `${topOffset}px`;
		});
	}
}
