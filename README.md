# Skir PHP Generator

Generates framework-agnostic PHP data objects for Skir schemas.

Generated PHP code uses `php-skir/runtime` for dense JSON serialization. If you use generated RPC clients, install `php-skir/client` as well.

## Installation

```bash
npm install --save-dev skir-php-generator
composer require php-skir/runtime
```

For generated typed RPC clients:

```bash
composer require php-skir/client
```

## Releasing

Create a GitHub release for the version in `package.json`. The release workflow reruns type checks, build, package validation, and tests before publishing to npm with provenance. It expects an `NPM_TOKEN` repository secret.

## Usage with Skir

Add the generator to `skir.yml`:

```yaml
generators:
  php:
    package: skir-php-generator
    output: generated/php
    config:
      namespace: App\Skir
```

Then run the Skir generator command for your project.

## Generated PHP

The generator emits readonly PHP classes for Skir structs and enum wrapper classes for Skir enums. Generated classes expose:

- `skirType()` for runtime type descriptors.
- `toArray()` and `fromArray()` for PHP array conversion.
- `toDenseJson()` and `fromDenseJson()` for dense JSON payloads.
- `toSkirValue()` and `fromSkirValue()` on generated enum classes.

SkirRPC methods are emitted in `SkirMethods.php` as `MethodDescriptor` instances. The generator also emits a module-scoped method enum such as `AdminSkirMethod.php` for attribute-based server routing.

When a module defines SkirRPC methods, the generator also emits `SkirRpcClient.php`. It wraps `Skir\Client\SkirClient` and exposes typed methods:

```php
use App\Skir\Admin\SkirRpcClient;
use Skir\Client\SkirClient as TransportSkirClient;

$client = new SkirRpcClient(new TransportSkirClient('https://example.com/skir'));
$user = $client->getUser($request);
```

For servers, the generator emits `AdminSkirMethod.php`, `AbstractSkirProcedures.php`, `SkirProcedures.php`, and `SkirProcedureProvider.php`.

The recommended Laravel server path is to use the generated method enum with `php-skir/server` controller routing:

```php
use App\Skir\Admin\AdminSkirMethod;
use App\Skir\Admin\GetUserRequest;
use App\Skir\Admin\User;
use Skir\Server\Attributes\SkirMethod;
use Skir\Server\SkirContext;

final class UserController
{
    #[SkirMethod(AdminSkirMethod::GetUser)]
    public function get(GetUserRequest $request, SkirContext $context): User
    {
        return new User(
            userId: $request->userId,
            name: 'Maxim',
        );
    }
}
```

Register the controller on a Skir endpoint:

```php
use App\Skir\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Skir\Server\Facades\Skir;

Route::skirRpc('/api/skir', [
    Skir::controller(UserController::class),
]);
```

The method enum resolves back to `SkirMethods::getUser()`, so the Skir schema remains the source of truth while your IDE can autocomplete enum cases.

The abstract procedure and interface/provider pair remain available as lower-level compatibility APIs.

## Namespaces and modules

The configured namespace defaults to `App\Skir`. Module directories become PHP subnamespaces and output directories:

```text
admin/users.skir -> App\Skir\Admin
```

When two generated records would otherwise use the same PHP class name in the same namespace, the generator prefixes the class with the module basename to keep output deterministic.

## Current scope

This package generates framework-agnostic PHP DTOs, method descriptors, typed client adapters, and Laravel Skir server procedure adapters. Laravel-specific data objects and server routing live in separate packages.
