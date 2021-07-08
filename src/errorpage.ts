import { Application } from "express";
import { Configuration } from "oidc-provider";
``
export default function errorPage(app: Application): Configuration["renderError"] {
    return async (ctx, out, err) => {
        if (out.error === "server_error") console.error(err);
        ctx.body = await new Promise((res, rej) => {
            app.render("error", { ...out, status: ctx.status }, (err, html) => {
                err ? rej(err) : res(html!);
            });
        });
    }
}