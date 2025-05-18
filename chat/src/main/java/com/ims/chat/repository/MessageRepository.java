package com.ims.chat.repository;

import com.ims.chat.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    @Query("SELECT m FROM MessageEntity m WHERE (m.senderId = :senderId AND m.receiverId = :receiverId) " +
            "OR (m.senderId = :receiverId AND m.receiverId = :senderId) " +
            "ORDER BY m.timestamp ASC")
    List<MessageEntity> findAllMessagesBetweenUsers(@Param("senderId") String senderId, @Param("receiverId") String receiverId);

    @Query("SELECT m FROM MessageEntity m WHERE m.senderId = :userId OR m.receiverId = :userId " +
            "ORDER BY m.timestamp DESC")
    List<MessageEntity> findAllMessagesForUser(@Param("userId") String userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM MessageEntity m WHERE m.senderId = :userId OR m.receiverId = :userId")
    void deleteAllMessagesForUser(@Param("userId") String userId);
}
