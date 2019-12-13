function createPaymentIntent() {

}

function getCartData(data) {
    if(!data || !data.items)
        return;
    
    console.log(data);

    // Все цены репрезентированы целыми числами в центах (2019 = 20 евро 19 центов)

    var totalCartPrice = data.items_subtotal_price;
    if(!totalCartPrice)
        return;

    var shippingPrice = 0.0;
    var subtotal = 0.0;
    var shippingName = ""

    // Работа с элементами

    var cartListContainer = document.querySelector(".summary-inner-products");
    if(!cartListContainer)
        return;
    while(!!cartListContainer.firstChild)
        cartListContainer.removeChild(cartListContainer.firstChild);

    for(var i = 0; i < data.items.length; i++) {
        var item = data.items[i];
        if(!item || !item.variant_id)
            continue;
        
        var variant = item.variant_id; // ID варианта продукта
        var name = item.product_title || ""; // Имя продукта
        var quantity = item.quantity; // Количество продукта
        
        // Элементы для расчета стоимости отправки
        
        if(variant == 29664946257999)
            continue;
        else if(variant == 30254459945039) // Versand (Standard)
            shippingPrice += 1000 * quantity; // 10€
        else if(variant == 30254471381071) // Versand (Sperrgut)
            shippingPrice += 2000 * quantity; // 20€
        else if(variant == 30254475968591) // Versand (Spedition)
            shippingPrice += 12000 * quantity; // 120€
        
        if([30254459945039, 30254471381071, 30254475968591].indexOf(variant) > -1) {
            shippingName += (!!shippingName ? ", " : "") + name;
            continue;
        }

        if(!item.properties)
            continue;

        var ppu = parseFloat(item.properties["_ppu"]); // Цена / 1м²
        var width = parseFloat(item.properties["_width"]); // Ширина (Breite)
        var height = parseFloat(item.properties["_height"]); // Высота (Länge)
        var strength = parseInt(item.properties["_prodID"].split("-").pop()) || 0; // Толщина (Stärke)

        var entgraten = !!item.properties["Entgraten"] && item.properties["Entgraten"].toUpperCase().indexOf('J') > -1; // Опция Entgraten активирована?
        var price = Math.ceil(ppu * 100 * quantity); // Цена одного продукта
        var imageURL = !!item.featured_image ? item.featured_image.url : ""; // URL картинки продукта
        var optionsWithValues = item.options_with_values || [];
        
        subtotal += price;
        console.log({"name": name, "variant": variant, "quantity": quantity, "ppu": ppu, "width": width, "height": height, "strength": strength, "entgraten": entgraten,
        "optionsWithValues": optionsWithValues, "price": price, "imageURL": imageURL});

        // Работа с элементом

        var elem = constructCartElement({"name": name, "variant": variant, "quantity": quantity, "ppu": ppu, "width": width, "height": height, "strength": strength, "entgraten": entgraten,
        "optionsWithValues": optionsWithValues, "price": price, "imageURL": imageURL});
        cartListContainer.appendChild(elem);
    }
    console.log("Total shipping price: " + shippingPrice);

    var subtotalElem = document.querySelector('#subtotal');
    if(!!subtotalElem) {
        subtotalElem.textContent = formatMoney(subtotal);
    }

    var shippingPriceText = formatMoney(shippingPrice);
    var shippingPriceElem = document.querySelector('#shipping-price');
    if(!!shippingPriceElem) {
        shippingPriceElem.textContent = shippingPriceText;
    }
    var shippingPriceElem2 = document.querySelector('.delivery-summ');
    if(!!shippingPriceElem2) {
        shippingPriceElem2.textContent = shippingPriceText;
    }

    if(!!shippingName) {
        var shippingLabel = document.querySelector('#shipping-label');
        shippingLabel.innerText = shippingName;
    }

    var totalPrice = Math.ceil(shippingPrice + subtotal);
    var totalPriceText = formatMoney(totalPrice);
    var totalPriceElem = document.querySelector('#total-price');
    if(!!totalPriceElem) {
        totalPriceElem.textContent = totalPriceText;
    }
    var totalPriceElem2 = document.querySelector('summary .top-summ');
    if(!!totalPriceElem2) {
        totalPriceElem2.textContent = totalPriceText;
    }
    
    createPaymentIntent(totalPrice);
}

function constructCartElement(attrs) {
    var moreThanOne = !!attrs["quantity"] && attrs["quantity"] > 1;
    var elem = div("product");
    var desc = div("desc", elem);
    var imgContainer = div("product-image-container", desc);
    var quantityLabel = moreThanOne ? div("quantity-label", imgContainer) : null;
    if(!!quantityLabel)
        text(attrs["quantity"].toString(), quantityLabel);
    var imgElem = img(!!attrs["imageURL"] ? attrs["imageURL"] : "img/no-image.png", "product-thumbnail-image", imgContainer);
    var sp = span("", desc);
    var header = h(2, attrs["name"] || "Unbenanntes Element", "", sp);
    var pe = p("", sp);
    if(!!attrs["optionsWithValues"]) {
        var anyFound = false;
        
        var materialart = getOptionByName(attrs["optionsWithValues"], "Materialart");
        if(!!materialart) {
            text(materialart, pe);
            anyFound = true;
        }

        if(!!attrs["strength"]) {
            if(anyFound) text(" / ", pe);
            text(attrs["strength"].toString() + " mm", pe);
            anyFound = true;
        }

        if(anyFound)
            br(pe);
    }
    text("Entgraten: " + (!!attrs["entgraten"] ? "Ja (+ 5,50€)" : "Nein"), pe);
    br(pe);
    if(!!attrs["width"]) {
        text("Zuschnitt-Breite: " + attrs["width"] + " cm", pe);
        br(pe);
    }
    if(!!attrs["height"]) {
        text("Zuschnitt-Länge: " + attrs["height"] + " cm", pe);
        br(pe);
    }

    if(moreThanOne && !!attrs["ppu"]) {
        text("Stückpreis: " + formatMoney(attrs["ppu"] * 100.0), pe);
        br(pe);
    }

    if(!!attrs["quantity"] && attrs["quantity"] > 1) {
        text("Anzahl: " + attrs["quantity"].toString(), pe);
        br(pe);
    }

    if(!!attrs["price"]) {
        var priceElem = div("top-summ variant-price", elem);
        text(formatMoney(attrs["price"]), priceElem);
    }

    return elem;
}

function genElem(tagName, className, parent) {
    var elem = document.createElement(tagName);
    if(!!className)
        elem.className = className;
    if(!!parent)
        parent.appendChild(elem);
    return elem;
}

function div(className, parent) {
    return genElem("div", className, parent);
}

function span(className, parent) {
    return genElem("span", className, parent);
}

function p(className, parent) {
    return genElem("p", className, parent);
}

function br(parent) {
    return genElem("br", "", parent);
}

function img(src, className, parent) {
    var elem = document.createElement("img");
    elem.src = src;
    if(!!className)
        elem.className = className;
    if(!!parent)
        parent.appendChild(elem);
    return elem;
}

function text(str, parent) {
    var node = document.createTextNode(str);
    if(!!parent)
        parent.appendChild(node);
    return node;
}

function h(level, content, className, parent) {
    var elem = genElem("h" + level.toString(), className, parent);
    if(!!content)
        text(content, elem);
    return elem;
}

function getOptionByName(optionsWithValues, name) {
    if(!optionsWithValues || !optionsWithValues.length || !name)
        return null;
    for(var i = 0; i < optionsWithValues.length; i++) {
        if(optionsWithValues[i].name == name)
            return optionsWithValues[i].value;
    }
    return null;
}

function formatMoney(amount) {
    return (amount / 100.0).toFixed(2).split('.').join(',') + " €";
}

{
    var script = document.createElement('script');
    script.src = 'https://www.plexiglas-dekoshop.de/cart.json?callback=getCartData';
    document.getElementsByTagName('head')[0].appendChild(script);
}