package com.ims.common.entity;

import jakarta.persistence.Table;

@Table(name = "user_message")
public class UserMessage {
    private String sender;

    private String receiver;

    private String content;
}
