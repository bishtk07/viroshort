// Credit tracking system that works with or without database
export class CreditTracker {
  private static readonly STORAGE_KEY = 'viroshort_credits';
  private static readonly DEFAULT_CREDITS = 1;

  // Get credits from localStorage (fallback when DB is not available)
  static getLocalCredits(userId: string): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const credits = JSON.parse(data);
        return credits[userId] ?? this.DEFAULT_CREDITS;
      }
      return this.DEFAULT_CREDITS;
    } catch {
      return this.DEFAULT_CREDITS;
    }
  }

  // Set credits in localStorage
  static setLocalCredits(userId: string, amount: number): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const credits = data ? JSON.parse(data) : {};
      credits[userId] = Math.max(0, amount);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(credits));
    } catch (error) {
      console.error('Error saving local credits:', error);
    }
  }

  // Consume a credit locally
  static consumeLocalCredit(userId: string): boolean {
    const currentCredits = this.getLocalCredits(userId);
    if (currentCredits > 0) {
      this.setLocalCredits(userId, currentCredits - 1);
      return true;
    }
    return false;
  }

  // Check if user has used their free credit
  static hasUsedFreeCredit(userId: string): boolean {
    const credits = this.getLocalCredits(userId);
    return credits < this.DEFAULT_CREDITS;
  }

  // Reset credits for a user (useful for testing)
  static resetLocalCredits(userId: string): void {
    this.setLocalCredits(userId, this.DEFAULT_CREDITS);
  }
} 