package com.ims.smartinventory.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class WarehouseRevenueResponse {
    private BigDecimal totalRevenue;
    private BigDecimal totalStorageFees;
    private BigDecimal totalMaintenanceCosts;
    private String currency;
    private LocalDateTime calculatedAt;
    private List<SectionRevenueDetail> sectionDetails;
    private List<UserRevenueDetail> userRevenues;
    private RevenueBreakdown breakdown;

    public WarehouseRevenueResponse(BigDecimal totalRevenue, String currency, LocalDateTime calculatedAt,
                                    List<SectionRevenueDetail> sectionDetails, List<UserRevenueDetail> userRevenues,
                                    RevenueBreakdown breakdown) {
        this.totalRevenue = totalRevenue;
        this.currency = currency;
        this.calculatedAt = calculatedAt;
        this.sectionDetails = sectionDetails;
        this.userRevenues = userRevenues;
        this.breakdown = breakdown;

        this.totalStorageFees = breakdown != null ? breakdown.getStorageCharges() : BigDecimal.ZERO;
        this.totalMaintenanceCosts = breakdown != null ? breakdown.getMaintenanceFees() : BigDecimal.ZERO;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class SectionRevenueDetail {
        private String sectionId;
        private String sectionName;
        private LocalDateTime activatedSince;
        private BigDecimal monthlyMaintenanceFee;
        private BigDecimal totalStorageFeesGenerated;
        private BigDecimal netProfit;
        private long monthsActive;
        private int totalProducts;
        private List<String> topUserIds;

        public SectionRevenueDetail(String sectionId, String sectionName, LocalDateTime activatedSince,
                                    BigDecimal monthlyMaintenanceFee, BigDecimal totalRevenueGenerated,
                                    long monthsActive, int totalProducts, List<String> topUserIds) {
            this.sectionId = sectionId;
            this.sectionName = sectionName;
            this.activatedSince = activatedSince;
            this.monthlyMaintenanceFee = monthlyMaintenanceFee;
            this.totalStorageFeesGenerated = totalRevenueGenerated;
            this.monthsActive = monthsActive;
            this.totalProducts = totalProducts;
            this.topUserIds = topUserIds;

            BigDecimal totalMaintenanceCost = monthlyMaintenanceFee.multiply(BigDecimal.valueOf(monthsActive));
            this.netProfit = totalRevenueGenerated.subtract(totalMaintenanceCost);
        }

        public BigDecimal getTotalRevenueGenerated() {
            return totalStorageFeesGenerated;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class UserRevenueDetail {
        private String userId;
        private String username;
        private String userRole;
        private BigDecimal totalStorageFeesCharged;
        private int totalLots;
        private int totalProducts;
        private LocalDateTime firstLotDate;
        private LocalDateTime lastLotDate;
        private List<LotRevenueDetail> lotDetails;

        public UserRevenueDetail(String userId, String username, String userRole, BigDecimal totalSpent,
                                 int totalLots, int totalProducts, LocalDateTime firstLotDate,
                                 LocalDateTime lastLotDate, List<LotRevenueDetail> lotDetails) {
            this.userId = userId;
            this.username = username;
            this.userRole = userRole;
            this.totalStorageFeesCharged = totalSpent;
            this.totalLots = totalLots;
            this.totalProducts = totalProducts;
            this.firstLotDate = firstLotDate;
            this.lastLotDate = lastLotDate;
            this.lotDetails = lotDetails;
        }

        public BigDecimal getTotalSpent() {
            return totalStorageFeesCharged;
        }
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LotRevenueDetail {
        private String lotId;
        private String lotCode;
        private LocalDateTime importDate;
        private BigDecimal estimatedCost;
        private String sectionName;
        private int productCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class RevenueBreakdown {
        private BigDecimal totalStorageFees;
        private BigDecimal totalMaintenanceCosts;
        private BigDecimal specialConditionSurcharges;
        private int totalActiveSections;
        private int totalActiveProducts;
        private int totalUsers;
        private BigDecimal profitMargin;

        public RevenueBreakdown(BigDecimal maintenanceFees, BigDecimal storageCharges, BigDecimal specialConditionSurcharges,
                                int totalActiveSections, int totalActiveProducts, int totalUsers) {
            this.totalMaintenanceCosts = maintenanceFees;
            this.totalStorageFees = storageCharges;
            this.specialConditionSurcharges = specialConditionSurcharges;
            this.totalActiveSections = totalActiveSections;
            this.totalActiveProducts = totalActiveProducts;
            this.totalUsers = totalUsers;

            if (storageCharges.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal netProfit = storageCharges.subtract(maintenanceFees);
                this.profitMargin = netProfit.divide(storageCharges, 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
            } else {
                this.profitMargin = BigDecimal.ZERO;
            }
        }

        public BigDecimal getMaintenanceFees() {
            return totalMaintenanceCosts;
        }

        public BigDecimal getStorageCharges() {
            return totalStorageFees;
        }
    }
}
