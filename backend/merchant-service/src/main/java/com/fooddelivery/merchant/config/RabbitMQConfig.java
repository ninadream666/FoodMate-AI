package com.fooddelivery.merchant.config;

import org.springframework.amqp.core.*;
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

    // 死信配置
    public static final String PRICING_DLX = "pricing.events.dlx";
    public static final String PRICING_DLQ = "merchant.pricing.updates.dlq";

    @Bean
    public TopicExchange pricingExchange() {
        return new TopicExchange(PRICING_EXCHANGE);
    }

    // 主队列：绑定死信交换机，消费失败的消息自动转到 DLQ
    @Bean
    public Queue pricingQueue() {
        return QueueBuilder.durable(PRICING_QUEUE)
                .withArgument("x-dead-letter-exchange", PRICING_DLX)
                .withArgument("x-dead-letter-routing-key", "dead.pricing")
                .build();
    }

    // 绑定队列到交换机，监听所有价格提案 (price.proposal.*)
    @Bean
    public Binding binding(Queue pricingQueue, TopicExchange pricingExchange) {
        return BindingBuilder.bind(pricingQueue).to(pricingExchange).with("price.proposal.#");
    }

    // 死信交换机
    @Bean
    public TopicExchange pricingDeadLetterExchange() {
        return new TopicExchange(PRICING_DLX);
    }

    // 死信队列
    @Bean
    public Queue pricingDeadLetterQueue() {
        return QueueBuilder.durable(PRICING_DLQ).build();
    }

    // 死信绑定
    @Bean
    public Binding deadLetterBinding() {
        return BindingBuilder.bind(pricingDeadLetterQueue())
                .to(pricingDeadLetterExchange())
                .with("dead.pricing");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    @Primary
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
