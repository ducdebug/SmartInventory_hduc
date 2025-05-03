package ims.com.dailycheck.repository;

import com.ims.common.entity.BaseProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface ProductExpirationRepository extends JpaRepository<BaseProductEntity, String> {

    /**
     * Find all expired food products as of the given date
     */
    @Query("SELECT p FROM FoodProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate < :today")
    List<BaseProductEntity> findExpiredFoodProducts(@Param("today") Date today);
    
    /**
     * Find all food products that will expire within the warning period
     */
    @Query("SELECT p FROM FoodProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate <= :warningDate AND p.expirationDate > :today")
    List<BaseProductEntity> findFoodProductsExpiringBefore(@Param("warningDate") Date warningDate, @Param("today") Date today);
    
    /**
     * Find all expired pharmaceutical products as of the given date
     */
    @Query("SELECT p FROM PharmaceuticalProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate < :today")
    List<BaseProductEntity> findExpiredPharmaceuticalProducts(@Param("today") Date today);
    
    /**
     * Find all pharmaceutical products that will expire within the warning period
     */
    @Query("SELECT p FROM PharmaceuticalProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate <= :warningDate AND p.expirationDate > :today")
    List<BaseProductEntity> findPharmaceuticalProductsExpiringBefore(@Param("warningDate") Date warningDate, @Param("today") Date today);
    
    /**
     * Find all expired cosmetic products as of the given date
     */
    @Query("SELECT p FROM CosmeticProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate < :today")
    List<BaseProductEntity> findExpiredCosmeticProducts(@Param("today") Date today);
    
    /**
     * Find all cosmetic products that will expire within the warning period
     */
    @Query("SELECT p FROM CosmeticProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate <= :warningDate AND p.expirationDate > :today")
    List<BaseProductEntity> findCosmeticProductsExpiringBefore(@Param("warningDate") Date warningDate, @Param("today") Date today);
    
    /**
     * Find all expired raw material products as of the given date
     */
    @Query("SELECT p FROM RawMaterialProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate < :today")
    List<BaseProductEntity> findExpiredRawMaterialProducts(@Param("today") Date today);
    
    /**
     * Find all raw material products that will expire within the warning period
     */
    @Query("SELECT p FROM RawMaterialProductEntity p WHERE p.dispatch IS NULL AND p.expirationDate <= :warningDate AND p.expirationDate > :today")
    List<BaseProductEntity> findRawMaterialProductsExpiringBefore(@Param("warningDate") Date warningDate, @Param("today") Date today);
    
    /**
     * Find all expired products of all types as of the given date
     */
    default List<BaseProductEntity> findExpiredProducts(Date today) {
        List<BaseProductEntity> result = findExpiredFoodProducts(today);
        result.addAll(findExpiredPharmaceuticalProducts(today));
        result.addAll(findExpiredCosmeticProducts(today));
        result.addAll(findExpiredRawMaterialProducts(today));
        return result;
    }
    
    /**
     * Find all products of all types that will expire within the warning period
     */
    default List<BaseProductEntity> findProductsExpiringBefore(Date warningDate, Date today) {
        List<BaseProductEntity> result = findFoodProductsExpiringBefore(warningDate, today);
        result.addAll(findPharmaceuticalProductsExpiringBefore(warningDate, today));
        result.addAll(findCosmeticProductsExpiringBefore(warningDate, today));
        result.addAll(findRawMaterialProductsExpiringBefore(warningDate, today));
        return result;
    }
}
