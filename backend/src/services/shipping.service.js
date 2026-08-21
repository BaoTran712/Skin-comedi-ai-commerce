class ShippingService {
    /**
     * Calculate shipping fee based on method and province
     * @param {string} method 'standard' or 'express'
     * @param {string} provinceCode 
     * @returns {number} shipping fee
     */
    calculateFee(method, provinceCode) {
        // Mock logic: 
        // standard = 30000
        // express = 50000
        if (method === 'express') {
            return 50000;
        }
        return 30000;
    }

    /**
     * Get available shipping methods
     * @returns {Array} List of methods
     */
    getAvailableMethods() {
        return [
            {
                id: 'standard',
                name: 'Giao hàng tiết kiệm',
                estimatedDays: '3-5 ngày',
                baseFee: 30000
            },
            {
                id: 'express',
                name: 'Giao hàng nhanh',
                estimatedDays: '1-2 ngày',
                baseFee: 50000
            }
        ];
    }
}

export default new ShippingService();
