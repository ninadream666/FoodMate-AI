package com.fooddelivery.merchant.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class RabbitMQConfig {

    // 保持与 Python 服务一致：使用 "pricing.events"
    public static final String PRICING_EXCHANGE = "pricing.events";
    public static final String PRICING_QUEUE = "merchant.pricing.updates";

    @Bean
    public TopicExchange pricingExchange() {
        return new TopicExchange(PRICING_EXCHANGE);
    }

    @Bean
    public Queue pricingQueue() {
        return new Queue(PRICING_QUEUE, true);
    }

    // 绑定队列到交换机，监听所有价格提案 (price.proposal.*)
    @Bean
    public Binding binding(Queue pricingQueue, TopicExchange pricingExchange) {
        return BindingBuilder.bind(pricingQueue).to(pricingExchange).with("price.proposal.#");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
    
    @Bean
    @Primary // 标记为主Bean，防止冲突
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}