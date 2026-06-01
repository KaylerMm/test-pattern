import { CheckoutService } from '../src/services/CheckoutService.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { UserMother } from './builders/UserMother.js';
import { Item } from '../src/domain/Item.js';

describe('CheckoutService', () => {
    describe('quando o pagamento falha', () => {
        it('deve retornar null', async () => {
            const carrinho = new CarrinhoBuilder().build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: false })
            };
            const repositoryDummy = {
                salvar: jest.fn()
            };
            const emailServiceDummy = {
                enviarEmail: jest.fn()
            };

            const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailServiceDummy);

            const pedido = await checkoutService.processarPedido(carrinho, '1234-5678-9012-3456');

            expect(pedido).toBeNull();
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        it('deve aplicar desconto e enviar email', async () => {
            const usuarioPremium = UserMother.umUsuarioPremium();
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Item Caro', 200)])
                .build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true })
            };
            const repositoryStub = {
                salvar: jest.fn().mockResolvedValue({ id: 1 })
            };
            const emailMock = {
                enviarEmail: jest.fn().mockResolvedValue(true)
            };

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            const pedido = await checkoutService.processarPedido(carrinho, '1234-5678-9012-3456');

            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, '1234-5678-9012-3456');
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                'Pedido 1 no valor de R$180'
            );
            expect(pedido).not.toBeNull();
        });
    });
});
